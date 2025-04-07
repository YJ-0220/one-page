import express from "express";
import passport from "passport";
import User from "../models/User";
import axios from "axios";
import {
  requireAuth,
  requireAdmin,
  generateTokens,
  refreshAccessToken,
  verifyToken,
  JWTPayload,
  AuthRequest,
} from "../middleware/authMiddleware";

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// ===== JWT 인증 관련 엔드포인트 =====

// 로그인 (이메일/비밀번호)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "이메일과 비밀번호를 모두 입력해주세요." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." });
    }

    // 로그인 시간 업데이트
    user.lastLogin = new Date();
    await user.save();

    // 토큰 생성
    const { accessToken, refreshToken } = generateTokens(user);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        userId: user.userId,
        displayName: user.displayName,
        email: user.email,
        photo: user.photo,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 토큰 갱신
router.post("/refresh-token", refreshAccessToken);

// 인증 상태 확인
router.get("/status", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.json({ authenticated: false });
    }

    const user = await User.findById(authReq.user.userId);
    if (!user) {
      return res.json({ authenticated: false });
    }

    return res.json({
      authenticated: true,
      user: {
        _id: user._id,
        userId: user.userId,
        displayName: user.displayName,
        email: user.email,
        photo: user.photo,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// ===== 소셜 로그인 관련 엔드포인트 =====

// 소셜 로그인 성공 응답 생성 함수
const createSuccessResponse = (
  accessToken: string,
  refreshToken: string,
  userName: string
) => {
  return `
    <html>
    <head>
      <title>로그인 성공</title>
      <script>
        function completeLogin() {
          try {
            if (window.opener) {
              // 팝업 창인 경우: postMessage로 메인 창에 알림
              window.opener.postMessage({
                type: 'LOGIN_SUCCESS',
                token: "${accessToken}",
                refreshToken: "${refreshToken}", 
                user: "${userName}"
              }, "*");
              window.close();
            } else {
              // 팝업이 아닌 경우: 쿼리 파라미터와 함께 리디렉션
              window.location.href = "${CLIENT_URL}/?token=${accessToken}&refresh=${refreshToken}&user=${userName}";
            }
          } catch(e) {
            document.getElementById('status').textContent = "오류 발생: " + e.message;
            document.getElementById('manualClose').style.display = 'block';
          }
        }
        
        // 페이지 로드 시 실행
        window.onload = function() {
          document.getElementById('status').textContent = '로그인 성공! 잠시만 기다려주세요...';
          // 바로 로그인 완료 처리
          completeLogin();
        };
      </script>
      <style>
        body {font-family: sans-serif; text-align: center; padding-top: 50px; background-color: #f5f5f5;}
        .container {max-width: 300px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);}
        h2 {color: #4CAF50; font-size: 18px;}
        button {padding: 8px 16px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 15px;}
        #status {margin: 15px 0; font-weight: bold; font-size: 14px;}
        #manualClose {display: none; margin-top: 15px;}
      </style>
    </head>
    <body>
      <div class="container">
        <h2>로그인 성공!</h2>
        <p id="status">잠시만 기다려주세요...</p>
        <div id="manualClose">
          <p>자동으로 창이 닫히지 않는 경우:</p>
          <button onclick="window.opener.location.reload(); window.close();">
            로그인 완료 및 창 닫기
          </button>
        </div>
      </div>
    </body>
    </html>
  `;
};

// 소셜 로그인 엔드포인트 (Passport 유지)
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

// 소셜 로그인 콜백 (passport 유지지만 세션 대신 JWT 토큰 사용)
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}/login`,
    session: false, // 세션 사용 안함
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
    session: false, // 세션 사용 안함
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

    // 로그인 성공 후 페이지 이동
    res.send(createSuccessResponse(accessToken, refreshToken, userName));
  } catch (error) {
    res.redirect(`${CLIENT_URL}/login?error=카카오 로그인 실패`);
  }
});

// ===== 사용자 관리 API =====

// 사용자 목록 조회 (관리자 전용)
router.get("/users/list", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password -__v");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 관리자 권한 토글 (관리자 전용)
router.patch(
  "/users/admin-toggle/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
      }

      user.isAdmin = !user.isAdmin;
      await user.save();

      res.json({
        message: `${user.displayName}의 관리자 권한이 ${
          user.isAdmin ? "부여" : "제거"
        }되었습니다.`,
        user: {
          _id: user._id,
          displayName: user.displayName,
          isAdmin: user.isAdmin,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
  }
);

// 사용자 삭제 (관리자 전용)
router.delete(
  "/users/delete/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await User.findByIdAndDelete(req.params.id);
      if (!result) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
      }
      res.json({ message: "사용자가 삭제되었습니다." });
    } catch (error) {
      res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
  }
);

export default router;
