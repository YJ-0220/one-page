import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import connectDB from "./db/db";
import { configurePassport } from "./config/passport";
import authRoutes from "./routes/authRouter";
import contactRoutes from "./routes/contactRouter";

// 환경 변수 로드
dotenv.config();

// 앱 및 포트 설정
const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// CORS 미들웨어 설정 (크로스 도메인용으로 강화)
app.use((req, res, next) => {
  // 프론트엔드 도메인 명시적으로 설정
  const allowedOrigins = [
    "http://localhost:5173",
    "https://yj-0220.github.io", // GitHub Pages 도메인
    CLIENT_URL
  ];
  
  const origin = req.headers.origin as string;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  // 크로스 도메인 쿠키 허용
  res.header("Access-Control-Allow-Credentials", "true");
  
  // 허용 메서드
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  
  // 허용 헤더
  res.header(
    "Access-Control-Allow-Headers", 
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  
  // 프리플라이트 요청 캐시 시간
  res.header("Access-Control-Max-Age", "86400");
  
  // COOP 헤더 설정
  res.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  
  // 추가 보안 헤더
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "SAMEORIGIN");

  // OPTIONS 요청 처리
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});

// 기본 미들웨어 설정
app.use(express.json());
app.use(cookieParser());

// 세션 설정 - OAuth 인증 과정에 필요
app.use(
  session({
    store: MongoStore.create({ 
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60, // 24시간 (초 단위)
    }),
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // 개발 환경에서는 false, 프로덕션에서는 true로 설정
      maxAge: 24 * 60 * 60 * 1000, // 24시간
    },
  })
);

// 패스포트 초기화
const passport = configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// 라우터 설정
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);

// 서버 상태 확인 엔드포인트
app.get("/", (req, res) => {
  res.json({ message: "서버가 작동중 입니다." });
});

// 초기 관리자 계정 생성 함수
const createInitialAdmin = async () => {
  try {
    const User = require("./models/User").default;
    const adminExists = await User.findOne({ isAdmin: true });
    if (adminExists) return;

    await User.create({
      displayName: "관리자",
      email: "admin@example.com",
      password: "admin123",
      isAdmin: true,
    });
    console.log("초기 관리자 계정이 생성되었습니다.");
  } catch (err) {
    console.error("초기 관리자 계정 생성 오류:", err);
  }
};

// DB 연결 후 서버 시작
connectDB().then(() => {
  createInitialAdmin();
  app.listen(PORT, () => {
    console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`);
  });
});
