import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// 선택적 JWT 인증 미들웨어 (토큰이 없어도 다음 진행)
export const optionalAuthenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      if ((err as any).name === "TokenExpiredError") {
        return res.status(401).json({
          error: "토큰이 만료되었습니다",
          code: "TOKEN_EXPIRED",
        });
      }
    }
  }
  next();
};

// JWT 인증 미들웨어 (필수)
export const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "인증이 필요합니다",
      code: "AUTH_REQUIRED",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    if ((err as any).name === "TokenExpiredError") {
      return res.status(401).json({
        error: "토큰이 만료되었습니다",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(403).json({
      error: "유효하지 않은 토큰입니다",
      code: "INVALID_TOKEN",
    });
  }
};

// 관리자 권한 확인 미들웨어
export const isAdmin = (req: any, res: any, next: any) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "관리자 권한이 필요합니다." });
  }
  next();
};
