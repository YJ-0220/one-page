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
  throw new Error("CLIENT_URL 또는 BACKEND_URL이 설정되지 않았습니다.");
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

// 소셜 로그인 엔드포인트 (Passport 유지)
router.get("/google", (req, res, next) => {
  // 콜백 URL을 쿼리 파라미터로 받아옴
  const callbackUrl = req.query.callback_url as string;
  
  // 대체 URL (fallback) 설정 - 기본값은 클라이언트 메인 URL
  const redirectUrl = callbackUrl || `${CLIENT_URL}/#/auth/callback`;
  
  // 인증 옵션
  const authOptions = {
    scope: ["profile", "email"],
    prompt: "select_account",
    state: redirectUrl, // state 파라미터로 콜백 URL 전달
  };
  
  // 소셜 인증 제공자로 리다이렉트
  passport.authenticate("google", authOptions)(req, res, next);
});

// LINE 로그인 엔드포인트
router.get("/line", (req, res, next) => {
  // 콜백 URL을 쿼리 파라미터로 받아옴
  const callbackUrl = req.query.callback_url as string;
  
  // 대체 URL (fallback) 설정 - 기본값은 클라이언트 메인 URL
  const redirectUrl = callbackUrl || `${CLIENT_URL}/#/auth/callback`;
  
  // 인증 옵션
  const authOptions = {
    session: false,
    state: redirectUrl, // state 파라미터로 콜백 URL 전달
    callbackURL: LINE_CALLBACK_URL,
  };
  
  // 소셜 인증 제공자로 리다이렉트
  passport.authenticate("line", authOptions)(req, res, next);
});

// Google 로그인 콜백
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      // 인증 실패 처리
      if (!req.user) {
        // state 파라미터에서 원래 리다이렉트 URL 추출
        const redirectUrl = req.query.state as string || `${CLIENT_URL}/login`;
        return res.redirect(`${redirectUrl}?error=인증 실패`);
      }

      // 사용자 정보 및 토큰 준비
      const user = req.user as any;
      const { accessToken, refreshToken } = generateTokens(user);

      // 원래 리다이렉트 URL (state 파라미터)
      const redirectUrl = req.query.state as string;

      // 사용자 정보 준비 및 인코딩
      const userData = {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        isAdmin: user.isAdmin,
      };
      const encodedUser = encodeURIComponent(JSON.stringify(userData));

      // 기본 파라미터 (모든 리다이렉트에 포함)
      const params = `accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodedUser}`;

      // 리다이렉트 URL이 있는 경우
      if (redirectUrl) {
        // URL에 이미 쿼리 파라미터가 있는지 확인
        const hasQuery = redirectUrl.includes("?");
        const separator = hasQuery ? "&" : "?";
        return res.redirect(`${redirectUrl}${separator}${params}`);
      }

      // 대체 리다이렉트 (fallback) - 클라이언트 콜백 엔드포인트로
      return res.redirect(`${CLIENT_URL}/auth/callback?${params}`);
    } catch (error) {
      // 오류 발생시 로그인 페이지로
      return res.redirect(`${CLIENT_URL}/login?error=서버 오류`);
    }
  }
);

// LINE 로그인 콜백
router.get(
  "/line/callback",
  passport.authenticate("line", { session: false }),
  async (req, res) => {
    try {
      // 인증 실패 처리
      if (!req.user) {
        // state 파라미터에서 원래 리다이렉트 URL 추출
        const redirectUrl = req.query.state as string || `${CLIENT_URL}/login`;
        return res.redirect(`${redirectUrl}?error=인증 실패`);
      }

      // 사용자 정보 및 토큰 준비
      const user = req.user as any;
      const { accessToken, refreshToken } = generateTokens(user);

      // 원래 리다이렉트 URL (state 파라미터)
      const redirectUrl = req.query.state as string;

      // 사용자 정보 준비 및 인코딩
      const userData = {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        isAdmin: user.isAdmin,
      };
      const encodedUser = encodeURIComponent(JSON.stringify(userData));

      // 기본 파라미터 (모든 리다이렉트에 포함)
      const params = `accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodedUser}`;

      // 리다이렉트 URL이 있는 경우
      if (redirectUrl) {
        // URL에 이미 쿼리 파라미터가 있는지 확인
        const hasQuery = redirectUrl.includes("?");
        const separator = hasQuery ? "&" : "?";
        return res.redirect(`${redirectUrl}${separator}${params}`);
      }

      // 대체 리다이렉트 (fallback) - 클라이언트 콜백 엔드포인트로
      return res.redirect(`${CLIENT_URL}/auth/callback?${params}`);
    } catch (error) {
      // 오류 발생시 로그인 페이지로
      return res.redirect(`${CLIENT_URL}/login?error=서버 오류`);
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
const authenticateJWT = passport.authenticate("jwt", { session: false });

// 보호된 라우트 예시
router.get("/protected", authenticateJWT, (req, res) => {
  res.json({ message: "인증된 사용자만 접근 가능합니다.", user: req.user });
});

export default router;
