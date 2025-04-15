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
    state?: string;
  }
}

// 환경변수 설정
const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL;
const BACKEND_URL = process.env.BACKEND_URL;

if (!CLIENT_URL || !BACKEND_URL) {
  throw new Error('CLIENT_URL 또는 BACKEND_URL이 설정되지 않았습니다.');
}

// 소셜 로그인 콜백 URL 설정
const GOOGLE_CALLBACK_URL = `${BACKEND_URL}/auth/google/callback`;
const LINE_CALLBACK_URL = `${BACKEND_URL}/auth/line/callback`;

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
  const callbackUrl = req.query.callback_url as string;
  
  // state 파라미터 생성
  const state = crypto.randomBytes(16).toString("hex");
  
  // LINE 인증 요청
  passport.authenticate("line", {
    session: false,
    state: state,
    callbackURL: `${BACKEND_URL}/auth/line/callback`,
  })(req, res, next);
});

// Google 로그인 콜백
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
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
        const userData = {
          _id: user._id,
          displayName: user.displayName,
          email: user.email,
          isAdmin: user.isAdmin
        };
        return res.redirect(
          `${callbackUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(userData))}`
        );
      }

      // 팝업 창에 메시지 전달
      const html = `
        <html>
          <body>
            <script>
              try {
                const userData = {
                  _id: "${user._id}",
                  displayName: "${user.displayName}",
                  email: "${user.email}",
                  isAdmin: ${user.isAdmin}
                };
                
                window.opener.postMessage({
                  type: "LOGIN_SUCCESS",
                  accessToken: "${accessToken}",
                  refreshToken: "${refreshToken}",
                  user: userData
                }, "*");
                
                // 창 닫기 시도
                window.close();
              } catch (e) {
                console.error('팝업창 닫기 실패:', e);
              }
            </script>
            <div style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
              <h2 style="color: #4CAF50;">로그인 성공!</h2>
              <p>로그인이 완료되었습니다. 이 창을 닫고 메인 페이지로 돌아가세요.</p>
              <button onclick="window.close()" style="background-color: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                창 닫기
              </button>
            </div>
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

// LINE 콜백 엔드포인트
router.get('/line/callback',
  passport.authenticate('line', { failureRedirect: '/login' }),
  async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.redirect(`${CLIENT_URL}/#/login?error=인증 실패`);
      }

      const user = req.user as any;
      const { accessToken, refreshToken } = generateTokens(user);

      // 팝업 창에 메시지 전달
      const html = `
        <html>
          <body>
            <script>
              try {
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
                
                // 창 닫기 시도
                window.close();
              } catch (e) {
                console.error('팝업창 닫기 실패:', e);
              }
            </script>
            <div style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
              <h2 style="color: #4CAF50;">로그인 성공!</h2>
              <p>로그인이 완료되었습니다. 이 창을 닫고 메인 페이지로 돌아가세요.</p>
              <button onclick="window.close()" style="background-color: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                창 닫기
              </button>
            </div>
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

// JWT 인증 미들웨어
const authenticateJWT = passport.authenticate('jwt', { session: false });

// 보호된 라우트 예시
router.get('/protected', authenticateJWT, (req, res) => {
  res.json({ message: '인증된 사용자만 접근 가능합니다.', user: req.user });
});

export default router;
