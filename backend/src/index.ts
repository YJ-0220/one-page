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
import MongoStore from "connect-mongo";
import eventPopupRouter from "./routes/eventPopup";
import imageSlideRouter from "./routes/imageSlide";
import testimonialRouter from "./routes/testimonial";
import fs from "fs";
import { connectDB } from "./config/database";

// 환경변수 로드
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 필수 환경변수 검증
const requiredEnvVars = [
  "CLIENT_URL",
  "BACKEND_URL",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`필수 환경변수 ${envVar}가 설정되지 않았습니다.`);
  process.exit(1);
}
}

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI as string;
const CLIENT_URL = process.env.CLIENT_URL as string;
const BACKEND_URL = process.env.BACKEND_URL as string;

// Express 앱 초기화
const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 미들웨어 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || "temp-session-secret",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 5 * 60 * 1000, // 5분
    },
  })
);

// 크로스 도메인 설정
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups"); // 기존 same-origin을 변경
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// CORS 설정
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Passport 설정
const passport = configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// 라우터 설정
app.use("/auth", authRouter);
app.use("/contact", contactRouter);
app.use("/stats", statsRouter);
app.use("/event-popup", eventPopupRouter);
app.use("/image-slide", imageSlideRouter);
app.use("/testimonial", testimonialRouter);

// 정적 파일 제공 설정
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// 기본 라우트
app.get("/", (req, res) => {
  res.send("API 서버가 실행 중입니다.");
});

// 서버 시작
const startServer = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(MONGODB_URI);

    // 기본 관리자 생성 (최초 실행 시)
    const adminExists = await User.findOne({ isAdmin: true });
    if (!adminExists) {
      const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD as string;
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      displayName: "관리자",
      email: "admin@example.com",
        password: hashedPassword,
      isAdmin: true,
    });
      console.log("기본 관리자 계정이 생성되었습니다.");
    }

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
      console.log(`클라이언트 URL: ${CLIENT_URL}`);
      console.log(`백엔드 URL: ${BACKEND_URL}`);
    });
  } catch (error) {
    console.error("서버 시작 중 오류 발생:", error);
    process.exit(1);
  }
};

// 서버 시작
startServer();
