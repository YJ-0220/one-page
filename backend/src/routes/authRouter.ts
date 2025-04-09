import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/User";
import bcrypt from "bcryptjs";
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
import session from "express-session";
import crypto from "crypto";

// 세션 타입 확장
declare module "express-session" {
  interface SessionData {
    callbackUrl?: string;
  }
}

// 환경변수 설정
const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// 소셜 로그인 콜백 URL 설정
const GOOGLE_CALLBACK_URL = `${BACKEND_URL}/api/auth/google/callback`;
const LINE_CALLBACK_URL = `${BACKEND_URL}/api/auth/line/callback`;
const KAKAO_CALLBACK_URL = `${BACKEND_URL}/api/auth/kakao/callback`;

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

// 소셜 로그인 성공 처리 함수를 수정
const handleLoginSuccess = (
  req: any,
  res: any,
  accessToken: string,
  refreshToken: string,
  userName: string
) => {
  // 팝업 창에 메시지 전달
  const html = `
    <html>
      <body>
        <script>
          window.opener.postMessage({
            type: "LOGIN_SUCCESS",
            accessToken: "${accessToken}",
            refreshToken: "${refreshToken}",
            userName: "${userName}"
          }, "*");
          window.close();
        </script>
        <p>로그인 성공! 이 창은 자동으로 닫힙니다.</p>
      </body>
    </html>
  `;

  res.send(html);
};

// 소셜 로그인 엔드포인트 (Passport 유지)
router.get("/google", (req, res, next) => {
  const callbackUrl = req.query.callback_url as string;
  if (callbackUrl) {
    // 콜백 URL을 쿼리 파라미터로 전달
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
      state: callbackUrl, // state 파라미터로 콜백 URL 전달
    })(req, res, next);
  } else {
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
    })(req, res, next);
  }
});

// LINE 로그인 엔드포인트
router.get("/line", (req, res, next) => {
  console.log("LINE 로그인 시도:", req.query);
  const callbackUrl = req.query.callback_url as string;
  
  // state 파라미터 생성 및 로깅
  const state = callbackUrl || crypto.randomBytes(16).toString('hex');
  console.log("LINE 로그인 state 파라미터:", state);

  // 세션 사용 없이 state 파라미터로만 처리
  passport.authenticate("line", {
    session: false, // 세션 사용 안 함
    state: state, // state 파라미터로 콜백 URL 전달
  })(req, res, next);
});

router.get("/kakao", (req, res) => {
  const kakaoAuthURL = "https://kauth.kakao.com/oauth/authorize";
  const callbackUrl = req.query.callback_url as string;
  const redirect_uri = callbackUrl || `${BACKEND_URL}/api/auth/kakao/callback`;

  res.redirect(
    `${kakaoAuthURL}?client_id=${
      process.env.KAKAO_CLIENT_ID
    }&redirect_uri=${redirect_uri}&response_type=code&state=${encodeURIComponent(
      callbackUrl || ""
    )}`
  );
});

// 소셜 로그인 콜백 (passport 유지지만 세션 대신 JWT 토큰 사용)
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        // state 파라미터에서 콜백 URL 가져오기
        const callbackUrl = req.query.state as string;
        return res.redirect(
          `${callbackUrl || CLIENT_URL}/#/login?error=인증 실패`
        );
      }

      const user = req.user as any;
      const { accessToken, refreshToken } = generateTokens(user);

      // state 파라미터에서 콜백 URL 가져오기
      const callbackUrl = req.query.state as string;
      if (callbackUrl) {
        return res.redirect(
          `${callbackUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}`
        );
      }

      // 팝업 창에 메시지 전달
      const html = `
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: "LOGIN_SUCCESS",
                accessToken: "${accessToken}",
                refreshToken: "${refreshToken}",
                user: {
                  _id: "${user._id}",
                  displayName: "${user.displayName}",
                  email: "${user.email}",
                  isAdmin: ${user.isAdmin}
                }
              }, "*");
              window.close();
            </script>
            <p>로그인 성공! 이 창은 자동으로 닫힙니다.</p>
          </body>
        </html>
      `;

      res.send(html);
    } catch (error) {
      console.error("Google 로그인 콜백 에러:", error);
      const callbackUrl = req.query.state as string;
      res.redirect(`${callbackUrl || CLIENT_URL}/#/login?error=서버 오류`);
    }
  }
);

router.get(
  "/line/callback",
  (req, res, next) => {
    console.log("LINE 콜백 수신:", req.query);
    
    // state 파라미터 처리 개선
    const state = req.query.state as string;
    console.log("LINE 콜백 state 파라미터:", state);
    
    passport.authenticate("line", {
      session: false,
      failWithError: false,
      state: state // state 파라미터 명시적 전달
    })(req, res, next);
  },
  (req, res) => {
    try {
      if (!req.user) {
        console.error("LINE 로그인 실패: 사용자 정보 없음");
        return res.redirect(`${CLIENT_URL}/#/login?error=인증 실패`);
      }

      const user = req.user as any;
      const { accessToken, refreshToken } = generateTokens(user);

      // state 파라미터에서 콜백 URL 가져오기
      const callbackUrl = req.query.state as string;
      console.log("LINE 콜백 처리 후 콜백 URL:", callbackUrl);
      
      if (callbackUrl) {
        return res.redirect(
          `${callbackUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}`
        );
      }

      // 팝업 창에 메시지 전달
      const html = `
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: "LOGIN_SUCCESS",
                accessToken: "${accessToken}",
                refreshToken: "${refreshToken}",
                user: {
                  _id: "${user._id}",
                  displayName: "${user.displayName}",
                  email: "${user.email}",
                  isAdmin: ${user.isAdmin}
                }
              }, "*");
              window.close();
            </script>
            <p>로그인 성공! 이 창은 자동으로 닫힙니다.</p>
          </body>
        </html>
      `;

      res.send(html);
    } catch (error) {
      console.error("LINE 로그인 콜백 에러:", error);
      res.redirect(`${CLIENT_URL}/#/login?error=서버 오류`);
    }
  }
);

router.get("/kakao/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
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

    // 콜백 URL이 있는 경우 리다이렉트
    const callbackUrl = state as string;
    if (callbackUrl) {
      return res.redirect(
        `${callbackUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    }

    // 팝업 창에 메시지 전달
    const html = `
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: "LOGIN_SUCCESS",
              accessToken: "${accessToken}",
              refreshToken: "${refreshToken}",
              user: {
                _id: "${user._id}",
                displayName: "${user.displayName}",
                email: "${user.email}",
                isAdmin: ${user.isAdmin}
              }
            }, "*");
            window.close();
          </script>
          <p>로그인 성공! 이 창은 자동으로 닫힙니다.</p>
        </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error("Kakao 로그인 콜백 에러:", error);
    const callbackUrl = req.query.state as string;
    res.redirect(`${callbackUrl || CLIENT_URL}/#/login?error=서버 오류`);
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
