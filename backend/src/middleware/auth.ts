import jwt from "jsonwebtoken";

// JWT 토큰에서 디코딩된 사용자 정보 인터페이스
interface JWTUser {
  userId: string;
  id?: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

// req에 user 필드 추가를 위한 타입 확장
declare global {
  namespace Express {
    interface Request {
      jwtUser?: JWTUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
console.log('JWT_SECRET 확인:', JWT_SECRET ? '설정됨' : '설정되지 않음', '길이:', JWT_SECRET?.length || 0);

// 선택적 JWT 인증 미들웨어 (토큰이 없어도 다음 진행)
export const optionalAuthenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  console.log('선택적 인증 확인:', req.path);

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.jwtUser = decoded;
      console.log('선택적 인증 성공:', JSON.stringify(decoded).substring(0, 100) + '...');
    } catch (err) {
      console.log('선택적 인증 실패:', (err as any).name, (err as any).message);
      if ((err as any).name === "TokenExpiredError") {
        return res.status(401).json({
          error: "토큰이 만료되었습니다",
          code: "TOKEN_EXPIRED",
        });
      }
    }
  } else {
    console.log('인증 헤더 없음 (선택적 인증)');
  }
  next();
};

// JWT 인증 미들웨어 (필수)
export const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  console.log('인증 요청:', req.path, '헤더:', authHeader ? '존재함' : '없음');

  if (!authHeader) {
    console.log('인증 헤더 없음, 인증 거부');
    return res.status(401).json({
      error: "인증이 필요합니다",
      code: "AUTH_REQUIRED",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('토큰 검증 성공:', decoded);
    req.jwtUser = decoded;
    next();
  } catch (err) {
    if ((err as any).name === "TokenExpiredError") {
      console.log('토큰 만료됨');
      return res.status(401).json({
        error: "토큰이 만료되었습니다",
        code: "TOKEN_EXPIRED",
      });
    }
    console.log('토큰 검증 실패:', (err as any).name);
    return res.status(403).json({
      error: "유효하지 않은 토큰입니다",
      code: "INVALID_TOKEN",
    });
  }
};

// 관리자 권한 확인 미들웨어
export const isAdmin = (req: any, res: any, next: any) => {
  if (!req.jwtUser?.isAdmin) {
    return res.status(403).json({ error: "관리자 권한이 필요합니다." });
  }
  next();
};
