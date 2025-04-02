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

// 토큰 생성 함수
export const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
    },
    JWT_SECRET,
    { expiresIn: "1d" }  // 액세스 토큰 1일로 설정
  );

  const refreshToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
    expiresIn: "30d",  // 리프레시 토큰 30일로 설정
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

// 소셜 로그인 성공 응답 생성 함수
const createSuccessResponse = (accessToken: string, refreshToken: string, userName: string) => {
  return `
    <html>
    <head>
      <title>로그인 성공</title>
      <script>
        // 디버깅용 콘솔
        console.log("로그인 성공: 토큰과 사용자 정보 전송 시도");
        
        function completeLogin() {
          try {
            if (window.opener) {
              // localStorage에 직접 저장
              try {
                window.opener.localStorage.setItem('authToken', "${accessToken}");
                window.opener.localStorage.setItem('refreshToken', "${refreshToken}");
                window.opener.localStorage.setItem('userName', "${userName}");
                console.log("부모 창에 토큰 저장 완료");
                
                // postMessage로도 전송 (이중 안전장치)
                window.opener.postMessage({
                  type: 'LOGIN_SUCCESS',
                  token: "${accessToken}",
                  refreshToken: "${refreshToken}", 
                  user: "${userName}"
                }, "*");
                
                // 명시적인 이벤트 트리거 시도
                try {
                  // 부모 창에 사용자 정의 이벤트 발생
                  const loginEvent = new window.opener.CustomEvent('socialLoginSuccess', {
                    detail: { user: "${userName}" }
                  });
                  window.opener.dispatchEvent(loginEvent);
                  console.log("부모 창에 이벤트 발생");
                } catch(eventError) {
                  console.log("이벤트 발생 실패:", eventError);
                }
                
                // 부모 창 리로드 (마지막 수단)
                setTimeout(() => {
                  if (window.opener && !window.opener.closed) {
                    window.opener.location.reload();
                  }
                  window.close();
                }, 1000);
              } catch(e) {
                // localStorage 접근 실패 시 메시지로 전달
                console.error("부모 창 localStorage 접근 오류:", e);
                window.opener.postMessage({
                  type: 'LOGIN_SUCCESS',
                  token: "${accessToken}",
                  refreshToken: "${refreshToken}", 
                  user: "${userName}"
                }, "*");
                
                setTimeout(() => window.close(), 1000);
              }
            } else {
              // 팝업이 아닌 경우 메인 페이지로 리디렉션
              window.location.href = "${CLIENT_URL}?token=${accessToken}&refresh=${refreshToken}&user=${userName}";
            }
          } catch(e) {
            console.error("로그인 완료 처리 중 오류:", e);
            document.getElementById('status').textContent = "오류 발생: " + e.message;
            document.getElementById('manualClose').style.display = 'block';
          }
        }
        
        // 페이지 로드 시 실행
        window.onload = function() {
          document.getElementById('status').textContent = '로그인 성공! 메인 페이지로 이동합니다...';
          // 잠시 후 로그인 완료 처리
          setTimeout(completeLogin, 500);
        };
      </script>
      <style>
        body {font-family: sans-serif; text-align: center; padding-top: 50px; background-color: #f5f5f5;}
        .container {max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);}
        h2 {color: #4CAF50;}
        button {padding: 10px 20px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;}
        #status {margin: 20px 0; font-weight: bold;}
        .error {color: red; margin-top: 10px; font-size: 12px;}
        #manualClose {display: none; margin-top: 20px;}
      </style>
    </head>
    <body>
      <div class="container">
        <h2>로그인 성공!</h2>
        <p id="status">메인 페이지로 이동 중입니다...</p>
        <div id="manualClose">
          <p>자동으로 처리되지 않았습니다. 아래 버튼을 클릭한 후 페이지를 새로고침 해보세요.</p>
          <button onclick="window.close()">창 닫기</button>
          <button onclick="completeLogin()">다시 시도</button>
        </div>
      </div>
    </body>
    </html>
  `;
};

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
    const userName = user.displayName || user.email || "사용자";

    res.send(createSuccessResponse(accessToken, refreshToken, userName));
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
    const userName = user.displayName || "사용자";

    res.send(createSuccessResponse(accessToken, refreshToken, userName));
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
    const userName = user.displayName || "사용자";

    res.send(createSuccessResponse(accessToken, refreshToken, userName));
  } catch (error) {
    console.error("카카오 로그인 오류:", error);
    res.redirect(`${CLIENT_URL}/login?error=카카오 로그인 실패`);
  }
});

// 인증 상태 확인
router.get("/status", optionalAuthenticateJWT, (req, res) => {
  if (req.jwtUser) {
    return res.json({
      status: "OK",
      authenticated: true,
      user: req.jwtUser,
    });
  } else {
    return res.json({
      authenticated: false,
    });
  }
});

// 로그인
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }
    
    const passwordValid = await user.comparePassword(password);
    
    if (!passwordValid) {
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    
    // 토큰을 응답 본문으로만 전송 (쿠키 사용 안함)
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
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;
