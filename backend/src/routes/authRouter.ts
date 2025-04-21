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

declare module "express-session" {
  interface SessionData {
    callbackUrl?: string;
    state?: string;
  }
}

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL;
const BACKEND_URL = process.env.BACKEND_URL;

if (!CLIENT_URL || !BACKEND_URL) {
  throw new Error("CLIENT_URL 또는 BACKEND_URL이 설정되지 않았습니다.");
}

const GOOGLE_CALLBACK_URL = `${BACKEND_URL}/auth/google/callback`;

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

    user.lastLogin = new Date();
    await user.save();

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

router.post("/refresh-token", refreshAccessToken);

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

router.get("/google", (req, res, next) => {
  const callbackUrl = req.query.callback_url as string;

  const redirectUrl = callbackUrl || `${CLIENT_URL}/auth/callback`;

  const authOptions = {
    scope: ["profile", "email"],
    prompt: "select_account",
    state: redirectUrl,
  };

  passport.authenticate("google", authOptions)(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        const redirectUrl =
          (req.query.state as string) || `${CLIENT_URL}/login`;
        return res.redirect(`${redirectUrl}?error=인증 실패`);
      }

      const user = req.user as any;
      const { accessToken, refreshToken } = generateTokens(user);

      const redirectUrl = req.query.state as string;

      const userData = {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        isAdmin: user.isAdmin,
      };
      const encodedUser = encodeURIComponent(JSON.stringify(userData));

      const params = `accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodedUser}`;

      if (redirectUrl) {
        const hasQuery = redirectUrl.includes("?");
        const separator = hasQuery ? "&" : "?";
        return res.redirect(`${redirectUrl}${separator}${params}`);
      }

      return res.redirect(`${CLIENT_URL}/auth/callback?${params}`);
    } catch (error) {
      return res.redirect(`${CLIENT_URL}/login?error=서버 오류`);
    }
  }
);

// ===== 사용자 관리 API =====
router.get("/users/list", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password -__v");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

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

const authenticateJWT = passport.authenticate("jwt", { session: false });

router.get("/protected", authenticateJWT, (req, res) => {
  res.json({ message: "인증된 사용자만 접근 가능합니다.", user: req.user });
});

export default router;
