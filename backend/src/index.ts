import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import session from 'express-session';
import connectDB from "./db";
import { configurePassport } from './config/passport';
import authRoutes from './routes/auth';
import contactRoutes from './routes/contact';

// 환경 변수 로드
dotenv.config();

// 앱 및 포트 설정
const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// 필수 환경 변수 확인
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("필수 환경 변수가 설정되지 않았습니다.");
  console.error("GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 환경 변수를 확인하세요.");
  process.exit(1);
}

// LINE 환경 변수 확인
if (!process.env.LINE_CHANNEL_ID || !process.env.LINE_CHANNEL_SECRET) {
  console.warn("LINE 로그인 관련 환경 변수가 설정되지 않았습니다.");
}

// KAKAO 환경 변수 확인
if (!process.env.KAKAO_CLIENT_ID || !process.env.KAKAO_CLIENT_SECRET) {
  console.warn("KAKAO 로그인 관련 환경 변수가 설정되지 않았습니다.");
}

// 미들웨어 설정
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    CLIENT_URL,
    "https://yj-0220.github.io",
    "https://yj-0220.github.io/one-page"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 세션 설정 - OAuth 인증 과정에 필요
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60000 // 1분만 유지 (OAuth 인증 과정에만 필요)
  }
}));

// 추가 보안 헤더 설정
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// 패스포트 초기화
const passport = configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// 라우터 설정
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);

// 서버 상태 확인 엔드포인트
app.get("/", (req, res) => {
  res.json({ message: "서버가 작동중 입니다." });
});

// 초기 관리자 계정 생성 함수
const createInitialAdmin = async () => {
  try {
    const User = require('./models/User').default;
    
    // 관리자 계정이 이미 있는지 확인
    const adminExists = await User.findOne({ isAdmin: true });
    if (adminExists) return;

    // 관리자 계정 생성
    await User.create({
      displayName: "관리자",
      email: "admin@example.com",
      password: "admin123", // 실제 운영에서는 강력한 비밀번호 사용
      isAdmin: true,
    });

    console.log("초기 관리자 계정이 생성되었습니다.");
  } catch (err) {
    console.error("초기 관리자 계정 생성 오류:", err);
  }
};

// DB 연결 후 초기 관리자 계정 생성 및 서버 시작
connectDB().then(() => {
  createInitialAdmin();
  
  app.listen(PORT, () => {
    console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`);
  });
}); 