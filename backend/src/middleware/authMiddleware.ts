import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User, { IUserDocument } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export interface JWTPayload {
  userId: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: IUserDocument;
  token?: string;
}

export const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      displayName: user.displayName,
      isAdmin: user.isAdmin || false,
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
    expiresIn: "30d",
  });

  return { accessToken, refreshToken };
};

export const verifyToken = async (
  token: string
): Promise<{ user: JWTPayload | null; error?: string }> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return { user: decoded };
  } catch (err: any) {
    const error =
      err.name === "TokenExpiredError"
        ? "토큰이 만료되었습니다"
        : "유효하지 않은 토큰입니다";
    return { user: null, error };
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const { user, error } = await verifyToken(token);
      if (user) {
        (req as AuthRequest).user = user as IUserDocument;
        (req as AuthRequest).token = token;
      } else if (error) {
        if (error === "토큰이 만료되었습니다") {
          return res.status(401).json({
            error,
            code: "TOKEN_EXPIRED",
          });
        }
      }
    } catch (err) {
    }
  }
  next();
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "인증이 필요합니다",
      code: "AUTH_REQUIRED",
    });
  }

  const token = authHeader.split(" ")[1];
  const { user, error } = await verifyToken(token);

  if (user) {
    (req as AuthRequest).user = user as IUserDocument;
    (req as AuthRequest).token = token;
    next();
  } else {
    if (error === "토큰이 만료되었습니다") {
      return res.status(401).json({
        error,
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(403).json({
      error: error || "유효하지 않은 토큰입니다",
      code: "INVALID_TOKEN",
    });
  }
};

export const isAdmin = async (req: Request): Promise<boolean> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  const token = authHeader.split(" ")[1];
  const { user } = await verifyToken(token);
  return user?.isAdmin === true;
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: "인증되지 않은 요청" });
  }

  if (authReq.user.isAdmin) {
    return next();
  } else {
    return res.status(403).json({ error: "관리자 권한이 필요합니다" });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "리프레시 토큰이 필요합니다." });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin || false,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({ accessToken });
  } catch (error) {
    return res
      .status(403)
      .json({ error: "리프레시 토큰이 유효하지 않습니다." });
  }
};
