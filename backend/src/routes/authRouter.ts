import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/User";
import axios from "axios";
import { authenticateJWT, optionalAuthenticateJWT, isAdmin } from "../middleware/auth";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// JWT_SECRET 길이 확인
console.log('JWT_SECRET 확인 (authRouter):', JWT_SECRET ? '설정됨' : '설정되지 않음', '길이:', JWT_SECRET?.length || 0);

// 토큰 생성 함수
export const generateTokens = (user: any) => {
  console.log('토큰 생성 시작, 사용자 정보:', {
    userId: user._id,
    email: user.email,
    displayName: user.displayName,
    isAdmin: user.isAdmin
  });

  const accessToken = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
    },
    JWT_SECRET,
    { expiresIn: "90d" }  // 30일에서 90일로 늘림
  );

  const refreshToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
    expiresIn: "180d",  // 60일에서 180일로 늘림
  });

  console.log('토큰 생성 완료:', {
    accessTokenLength: accessToken.length,
    refreshTokenLength: refreshToken.length
  });

  return { accessToken, refreshToken };
};

// 소셜 로그인 엔드포인트
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get("/line", passport.authenticate("line"));

router.get("/kakao", (req, res) => {
  const kakaoAuthURL = "https://kauth.kakao.com/oauth/authorize";
  const redirect_uri = `${BACKEND_URL}/api/auth/kakao/callback`;
  res.redirect(
    `${kakaoAuthURL}?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${redirect_uri}&response_type=code`
  );
});

// 콜백 처리
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}/login`,
    session: false,
  }),
  (req, res) => {
    const user = req.user as any;
    const { accessToken, refreshToken } = generateTokens(user);
    const userName = user
      ? user.displayName || user.email || "구글사용자"
      : "구글사용자";

    // COOP 헤더 설정
    res.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

    res.send(`
      <script>
        try {
          if (window.opener && window.opener.postMessage) {
            window.opener.postMessage({
              type: 'login_success',
              provider: 'google',
              token: "${accessToken}",
              refreshToken: "${refreshToken}",
              user: "${userName}"
            }, "*"); // 모든 출처 허용 (보안을 위해 나중에 정확한 출처로 변경 가능)
            console.log("메시지 전송 완료");
          } else {
            console.error("window.opener를 찾을 수 없음");
          }
        } catch (e) {
          console.error("postMessage 오류:", e);
        }
        setTimeout(() => window.close(), 1000);
      </script>
      <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
        <h3>로그인 완료!</h3>
        <p>이 창은 자동으로 닫힙니다...</p>
        <p>(창이 자동으로 닫히지 않으면 직접 닫아주세요.)</p>
      </div>
    `);
  }
);

router.get(
  "/line/callback",
  passport.authenticate("line", {
    failureRedirect: `${CLIENT_URL}/login`,
    session: false,
  }),
  (req, res) => {
    const user = req.user as any;
    const { accessToken, refreshToken } = generateTokens(user);
    const userName = user ? user.displayName || "라인사용자" : "라인사용자";

    // COOP 헤더 설정
    res.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

    res.send(`
      <script>
        try {
          if (window.opener && window.opener.postMessage) {
            window.opener.postMessage({
              type: 'login_success',
              provider: 'line',
              token: "${accessToken}",
              refreshToken: "${refreshToken}",
              user: "${userName}"
            }, "*"); // 모든 출처 허용
            console.log("메시지 전송 완료");
          } else {
            console.error("window.opener를 찾을 수 없음");
          }
        } catch (e) {
          console.error("postMessage 오류:", e);
        }
        setTimeout(() => window.close(), 1000);
      </script>
      <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
        <h3>로그인 완료!</h3>
        <p>이 창은 자동으로 닫힙니다...</p>
        <p>(창이 자동으로 닫히지 않으면 직접 닫아주세요.)</p>
      </div>
    `);
  }
);

router.get("/kakao/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const kakaoTokenURL = "https://kauth.kakao.com/oauth/token";
    const redirect_uri = `${BACKEND_URL}/api/auth/kakao/callback`;

    // 토큰 요청
    const tokenResponse = await axios.post(
      kakaoTokenURL,
      {
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri,
        code,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    // 사용자 정보 요청
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    const profile = userResponse.data;
    const email =
      profile.kakao_account?.email || `kakao_${profile.id}@example.com`;

    let user = await User.findOne({
      $or: [{ email }, { kakaoId: profile.id.toString() }],
    });

    if (!user) {
      user = await User.create({
        displayName: profile.kakao_account?.profile?.nickname || "카카오사용자",
        email,
        password:
          Math.random().toString(36).substring(2) + Date.now().toString(36),
        photo: profile.kakao_account?.profile?.profile_image_url || "",
        isAdmin: false,
        kakaoId: profile.id.toString(),
      });
    } else if (!user.kakaoId) {
      user = await User.findByIdAndUpdate(
        user._id,
        { kakaoId: profile.id.toString() },
        { new: true }
      );
    }

    if (!user) {
      return res.status(500).send("사용자 생성 중 오류가 발생했습니다.");
    }

    const { accessToken, refreshToken } = generateTokens(user);
    const userName = user.displayName || "카카오사용자";

    // COOP 헤더 설정
    res.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

    res.send(`
      <script>
        try {
          if (window.opener && window.opener.postMessage) {
            window.opener.postMessage({
              type: 'login_success',
              provider: 'kakao',
              token: "${accessToken}",
              refreshToken: "${refreshToken}",
              user: "${userName}"
            }, "*"); // 모든 출처 허용
            console.log("메시지 전송 완료");
          } else {
            console.error("window.opener를 찾을 수 없음");
          }
        } catch (e) {
          console.error("postMessage 오류:", e);
        }
        setTimeout(() => window.close(), 1000);
      </script>
      <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
        <h3>로그인 완료!</h3>
        <p>이 창은 자동으로 닫힙니다...</p>
        <p>(창이 자동으로 닫히지 않으면 직접 닫아주세요.)</p>
      </div>
    `);
  } catch (error) {
    console.error("카카오 로그인 오류:", error);
    res.redirect(`${CLIENT_URL}/login?error=카카오 로그인 실패`);
  }
});

// 인증 상태 확인
router.get("/status", optionalAuthenticateJWT, (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('인증 상태 요청, 헤더:', authHeader ? `${authHeader.substring(0, 20)}...` : '없음');
  console.log('req.jwtUser:', req.jwtUser ? JSON.stringify(req.jwtUser) : '없음');

  if (req.jwtUser) {
    console.log('인증된 사용자:', req.jwtUser.userId || req.jwtUser.id || '알 수 없음');
    return res.json({
      status: "OK",
      authenticated: true,
      user: req.jwtUser,
    });
  } else {
    console.log('인증되지 않은 요청');
    return res.json({
      authenticated: false,
    });
  }
});

// 로그인
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log('로그인 시도:', email);

  try {
    const user = await User.findOne({ email });
    console.log('사용자 찾기 결과:', user ? '사용자 발견' : '사용자 없음');
    
    if (!user) {
      console.log('로그인 실패: 사용자 없음');
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }
    
    const passwordValid = await user.comparePassword(password);
    console.log('비밀번호 검증 결과:', passwordValid ? '성공' : '실패');
    
    if (!passwordValid) {
      console.log('로그인 실패: 비밀번호 불일치');
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    
    // 최종 응답 로그
    console.log('로그인 성공! 토큰 전송:', {
      accessTokenStart: accessToken.substring(0, 10) + '...',
      refreshTokenStart: refreshToken.substring(0, 10) + '...',
      userId: user._id
    });
    
    // 토큰을 쿠키에도 설정
    res.cookie('authToken', accessToken, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90일
      sameSite: 'lax'
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 180 * 24 * 60 * 60 * 1000, // 180일
      sameSite: 'lax'
    });
    
    res.json({
      accessToken,
      refreshToken,
      user: {
        userId: user._id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("로그인 오류:", error);
    res.status(500).json({ error: "로그인 처리 중 오류가 발생했습니다." });
  }
});

// 토큰 갱신
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: "리프레시 토큰이 필요합니다.",
      code: "REFRESH_TOKEN_REQUIRED",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        error: "사용자를 찾을 수 없습니다.",
        code: "USER_NOT_FOUND",
      });
    }

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (error) {
    if ((error as any).name === "TokenExpiredError") {
      return res.status(401).json({
        error: "리프레시 토큰이 만료되었습니다.",
        code: "REFRESH_TOKEN_EXPIRED",
      });
    }

    res.status(403).json({
      error: "유효하지 않은 리프레시 토큰입니다.",
      code: "INVALID_REFRESH_TOKEN",
    });
  }
});

// 사용자 목록 조회 API (관리자 전용)
router.get('/users/list', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 관리자 권한 변경 API
router.patch('/users/admin-toggle/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    // 관리자 권한 토글
    user.isAdmin = !user.isAdmin;
    await user.save();
    
    res.json({ 
      message: `${user.displayName}의 관리자 권한이 ${user.isAdmin ? '부여' : '제거'}되었습니다.`,
      user: {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        isAdmin: user.isAdmin
      } 
    });
  } catch (error) {
    console.error('권한 변경 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 사용자 삭제 API (관리자 전용)
router.delete('/users/delete/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    res.json({ message: `${user.displayName} 사용자가 삭제되었습니다.` });
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;
