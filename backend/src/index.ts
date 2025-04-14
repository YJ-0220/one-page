import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { configurePassport } from "./config/passport";
import authRouter from "./routes/authRouter";
import contactRouter from "./routes/contactRouter";
import statsRouter from "./routes/statsRouter";
import User from "./models/User";
import bcrypt from "bcryptjs";
import path from "path";
import session from "express-session";

// 환경변수 로드
dotenv.config();

// 환경 변수 설정
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/one-page";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// Express 앱 초기화
const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 미들웨어 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // 개발 환경에서는 false로 설정
    sameSite: 'none', // 크로스 도메인 요청을 위해 none으로 설정
    maxAge: 5 * 60 * 1000 // 5분으로 제한 (LINE 로그인에 필요한 최소 시간)
  }
}));

// 크로스 도메인 설정
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups"); // 기존 same-origin을 변경
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// CORS 설정
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

// Passport 설정
const passport = configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// 라우터 설정
app.use("/auth", authRouter);
app.use("/contact", contactRouter);
app.use("/stats", statsRouter);

// 기본 라우트
app.get("/", (req, res) => {
  res.send("API 서버가 실행 중입니다.");
});

// 서버 시작
const startServer = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB 연결 성공!");
    
    // 기본 관리자 생성 (최초 실행 시)
    const adminExists = await User.findOne({ isAdmin: true });
    if (!adminExists) {
      const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "admin123";
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      displayName: "관리자",
      email: "admin@example.com",
        password: hashedPassword,
      isAdmin: true,
      });
    }

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log("환경 변수:");
      console.log("- PORT:", PORT);
      console.log("- CLIENT_URL:", CLIENT_URL);
      console.log("- BACKEND_URL:", BACKEND_URL);
    });
  } catch (error) {
    process.exit(1);
  }
};

// 서버 시작
startServer();
