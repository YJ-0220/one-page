import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRouter from "./routes/authRouter";
import contactRouter from "./routes/contactRouter";
import statsRouter from "./routes/statsRouter";
import { configurePassport } from "./config/passport";
import User from "./models/User";
import bcrypt from "bcryptjs";

// 환경 변수 가져오기
dotenv.config();

// 환경 변수 설정
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/one-page-db";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Express 앱 초기화
const app = express();


// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 크로스 도메인 설정
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups"); // 기존 same-origin을 변경
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// CORS 설정
app.use(
  cors({
    origin: function (origin, callback) {
      // 허용할 도메인 목록
      const allowedOrigins = [CLIENT_URL];
      
      // origin이 없거나(개발 도구 등에서 직접 요청), 허용 목록에 있다면 허용
      const allowNull = true; // null origin 허용 여부 (Postman 등 테스트 도구)
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowNull) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Passport 설정
const passport = configurePassport();
app.use(passport.initialize());

// 라우터 설정
app.use("/api/auth", authRouter);
app.use("/api/contact", contactRouter);
app.use("/api/stats", statsRouter);

// 기본 라우트
app.get("/", (req, res) => {
  res.send("API 서버가 실행 중입니다.");
});

// 서버 시작
const startServer = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(MONGO_URI);
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
      console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
      // 서버 실행 완료
    });
  } catch (error) {
    process.exit(1);
  }
};

// 서버 시작
startServer();
