import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LineStrategy } from "passport-line";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User";
import connectDB from "./db";
import Contact from "./models/Contact";
import axios from "axios";
import jwt from 'jsonwebtoken';
import session from 'express-session';

// 환경 변수 로드
dotenv.config();

// 앱 및 포트 설정
const app = express();
const PORT = process.env.PORT || 3000;

// 필수 환경 변수 확인
if (
  !process.env.GOOGLE_CLIENT_ID ||
  !process.env.GOOGLE_CLIENT_SECRET ||
  !process.env.CLIENT_URL
) {
  console.error("필수 환경 변수가 설정되지 않았습니다.");
  console.error(
    "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CLIENT_URL 환경 변수를 확인하세요."
  );
  process.exit(1);
}

// LINE 환경 변수 확인
if (!process.env.LINE_CHANNEL_ID || !process.env.LINE_CHANNEL_SECRET) {
  console.warn("LINE 로그인 관련 환경 변수가 설정되지 않았습니다.");
  console.warn("LINE_CHANNEL_ID, LINE_CHANNEL_SECRET 환경 변수를 확인하세요.");
}

//---------- 미들웨어 설정 ----------//
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "https://yj-0220.github.io",
      "https://yj-0220.github.io/one-page"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 세션 설정 - OAuth 인증 과정에서만 필요
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

//---------- Passport 설정 ----------//
app.use(passport.initialize());
app.use(passport.session()); // 세션 지원 추가

// 세션에 사용자 직렬화/역직렬화 (최소한으로 유지)
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// JWT 비밀키 설정
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// JWT 토큰 생성 함수 (액세스 토큰과 리프레시 토큰 모두 생성)
const generateTokens = (user: any) => {
  // 액세스 토큰 (30일로 설정)
  const accessToken = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      displayName: user.displayName,
      isAdmin: user.isAdmin
    }, 
    JWT_SECRET, 
    { expiresIn: '30d' }
  );
  
  // 리프레시 토큰 (60일로 설정)
  const refreshToken = jwt.sign(
    { userId: user._id },
    JWT_SECRET,
    { expiresIn: '60d' }
  );
  
  return { accessToken, refreshToken };
};

// 기존 토큰 생성 함수를 유지 (호환성)
const generateToken = (user: any) => {
  const payload = {
    userId: user._id,
    email: user.email,
    displayName: user.displayName,
    isAdmin: user.isAdmin
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

// JWT 인증 미들웨어
const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res.sendStatus(403);
      }
      
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// 선택적 JWT 인증 미들웨어 - 토큰이 없어도 다음으로 진행
const optionalAuthenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  console.log('Authorization 헤더:', authHeader);
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    console.log('요청 토큰:', token ? token.substring(0, 10) + '...' : 'undefined');
    
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (!err) {
        console.log('JWT 토큰 검증 성공, 사용자 정보:', user);
        req.user = user;
      } else {
        console.error('JWT 토큰 검증 실패:', err.message);
      }
    });
  } else {
    console.log('인증 헤더 없음');
  }
  
  next();
};

// 관리자 권한 확인 미들웨어
const isAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: "인증되지 않은 요청입니다." });
  }
  
  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "유효하지 않은 토큰입니다." });
    }
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: "관리자 권한이 필요합니다." });
    }
    
    req.user = user;
    next();
  });
};

//---------- OAuth 전략 설정 ----------//
//line 전략 설정
passport.use(
  new LineStrategy(
    {
      channelID: process.env.LINE_CHANNEL_ID as string,
      channelSecret: process.env.LINE_CHANNEL_SECRET as string,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/line/callback`,
      scope: "profile openid email",
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: any
    ) => {
      try {
        // 이메일이 없는 경우 LINE ID를 기준으로 사용자 확인
        const email = profile.email || `line_${profile.id}@example.com`;

        // 기존 사용자 확인 (이메일 또는 LINE ID로)
        let user = await User.findOne({
          $or: [{ email }, { lineId: profile.id }],
        });

        // 새 사용자이면 DB에 저장
        if (!user) {
          user = await User.create({
            displayName: profile.displayName || profile.name || "라인사용자",
            email,
            password:
              Math.random().toString(36).substring(2) + Date.now().toString(36), // 임의 비밀번호 생성
            photo: profile.pictureUrl || "",
            isAdmin: false,
            lineId: profile.id,
          });
        }
        // 기존 사용자이지만 LINE ID가 없는 경우 업데이트
        else if (!user.lineId) {
          user = await User.findByIdAndUpdate(
            user._id,
            { lineId: profile.id },
            { new: true }
          );
        }

        // 비밀번호 제외하고 반환
        const userObj = user!.toObject();
        return done(null, {
          ...userObj,
          password: undefined,
        });
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// Google OAuth 전략 설정
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
      scope: ["profile", "email"],
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 이메일이 없는 경우 에러 처리
        const email =
          profile.emails && profile.emails[0] ? profile.emails[0].value : "";
        if (!email) {
          return done(
            new Error("이메일 정보를 가져올 수 없습니다."),
            undefined
          );
        }

        // 기존 사용자 확인
        let user = await User.findOne({ email });

        // 새 사용자이면 DB에 저장
        if (!user) {
          user = await User.create({
            displayName: profile.displayName || "구글사용자",
            email,
            password:
              Math.random().toString(36).substring(2) + Date.now().toString(36), // 임의 비밀번호 생성
            photo:
              profile.photos && profile.photos[0]
                ? profile.photos[0].value
                : "",
            isAdmin: false,
            // 소셜 계정 정보 추가
            googleId: profile.id,
          });
        }
        // 기존 사용자이지만 구글 ID가 없는 경우 업데이트
        else if (!user.googleId) {
          user = await User.findByIdAndUpdate(
            user._id,
            { googleId: profile.id },
            { new: true }
          );
        }

        // 비밀번호 제외하고 반환
        const userObj = user!.toObject();
        return done(null, {
          ...userObj,
          password: undefined,
        });
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

//---------- 인증 관련 라우트 ----------//
// 구글 로그인 시작 엔드포인트
app.get(
  "/api/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account", // 항상 계정 선택 화면 표시
  })
);

// 라인 로그인 시작 엔드포인트
app.get("/api/auth/line", passport.authenticate("line"));

// 카카오 OAuth 전략 설정
app.get("/api/auth/kakao", (req, res) => {
  // 카카오 로그인 페이지로 리다이렉트
  const kakaoAuthURL = "https://kauth.kakao.com/oauth/authorize";
  const redirect_uri = `${process.env.BACKEND_URL}/api/auth/kakao/callback`;

  res.redirect(
    `${kakaoAuthURL}?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${redirect_uri}&response_type=code`
  );
});

// 구글 로그인 콜백 처리 엔드포인트
app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false,
  }),
  (req, res) => {
    const user = req.user as any;
    
    // JWT 토큰 생성 (액세스 토큰과 리프레시 토큰)
    const { accessToken, refreshToken } = generateTokens(user);
    
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const userName = user
      ? user.displayName || user.email || "구글사용자"
      : "구글사용자";

    // 토큰을 postMessage로 전달
    res.send(`
      <script>
        console.log("로그인 성공, 부모 창으로 메시지 전송 시도");
        try {
          if (window.opener) {
            window.opener.postMessage({
              type: 'login_success',
              provider: 'google',
              token: "${accessToken}",
              refreshToken: "${refreshToken}",
              user: "${userName}"
            }, "${clientUrl}");
            console.log("메시지 전송 성공");
          } else {
            console.error("window.opener가 없습니다.");
          }
        } catch (err) {
          console.error("메시지 전송 오류:", err);
        }
        
        // 창 닫기 시도
        console.log("팝업 창 닫기 시도");
        setTimeout(() => {
          try {
            window.close();
          } catch (err) {
            console.error("창 닫기 오류:", err);
            document.body.innerHTML += '<p>창이 자동으로 닫히지 않으면 <a href="#" onclick="window.close()">여기를 클릭하세요</a></p>';
          }
        }, 1000);
      </script>
      <div style="text-align: center; font-family: Arial, sans-serif; margin-top: 50px;">
        <h3>로그인 완료!</h3>
        <p>이 창은 자동으로 닫힙니다...</p>
      </div>
    `);
  }
);

// LINE 콜백 처리
app.get(
  "/api/auth/line/callback",
  passport.authenticate("line", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false,
  }),
  (req, res) => {
    const user = req.user as any;
    
    // JWT 토큰 생성 (액세스 토큰과 리프레시 토큰)
    const { accessToken, refreshToken } = generateTokens(user);
    
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const userName = user ? user.displayName || "라인사용자" : "라인사용자";

    res.send(`
      <script>
        console.log("로그인 성공, 부모 창으로 메시지 전송 시도");
        try {
          if (window.opener) {
            window.opener.postMessage({
              type: 'login_success',
              provider: 'line',
              token: "${accessToken}",
              refreshToken: "${refreshToken}",
              user: "${userName}"
            }, "${clientUrl}");
            console.log("메시지 전송 성공");
          } else {
            console.error("window.opener가 없습니다.");
          }
        } catch (err) {
          console.error("메시지 전송 오류:", err);
        }
        
        setTimeout(() => {
          try {
            window.close();
          } catch (err) {
            console.error("창 닫기 오류:", err);
            document.body.innerHTML += '<p>창이 자동으로 닫히지 않으면 <a href="#" onclick="window.close()">여기를 클릭하세요</a></p>';
          }
        }, 1000);
      </script>
      <div style="text-align: center; font-family: Arial, sans-serif; margin-top: 50px;">
        <h3>로그인 완료!</h3>
        <p>이 창은 자동으로 닫힙니다...</p>
      </div>
    `);
  }
);

// 카카오 콜백 처리
app.get("/api/auth/kakao/callback", async (req, res) => {
  const code = req.query.code;
  const kakaoTokenURL = "https://kauth.kakao.com/oauth/token";
  const redirect_uri = `${process.env.BACKEND_URL}/api/auth/kakao/callback`;

  try {
    // 토큰 요청
    const tokenResponse = await axios.post(
      kakaoTokenURL,
      {
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri,
        code,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    // 사용자 정보 요청
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    const profile = userResponse.data;

    // 이메일이 없는 경우 카카오 ID를 기준으로 사용자 확인
    const email =
      profile.kakao_account?.email || `kakao_${profile.id}@example.com`;

    // 기존 사용자 확인 (이메일 또는 카카오 ID로)
    let user = await User.findOne({
      $or: [{ email }, { kakaoId: profile.id.toString() }],
    });

    // 새 사용자이면 DB에 저장
    if (!user) {
      user = await User.create({
        displayName: profile.kakao_account?.profile?.nickname || "카카오사용자",
        email,
        password:
          Math.random().toString(36).substring(2) + Date.now().toString(36), // 임의 비밀번호 생성
        photo: profile.kakao_account?.profile?.profile_image_url || "",
        isAdmin: false,
        kakaoId: profile.id.toString(),
      });
    }
    // 기존 사용자이지만 카카오 ID가 없는 경우 업데이트
    else if (!user.kakaoId) {
      user = await User.findByIdAndUpdate(
        user._id,
        { kakaoId: profile.id.toString() },
        { new: true }
      );
    }

    if (!user) {
      return res.status(500).send("사용자 생성 중 오류가 발생했습니다.");
    }

    // JWT 토큰 생성 (액세스 토큰과 리프레시 토큰)
    const { accessToken, refreshToken } = generateTokens(user);
    
    const userName = user.displayName || "카카오사용자";
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    // 토큰을 postMessage로 전달
    res.send(`
      <script>
        console.log("로그인 성공, 부모 창으로 메시지 전송 시도");
        try {
          if (window.opener) {
            window.opener.postMessage({
              type: 'login_success',
              provider: 'kakao',
              token: "${accessToken}",
              refreshToken: "${refreshToken}",
              user: "${userName}"
            }, "${clientUrl}");
            console.log("메시지 전송 성공");
          } else {
            console.error("window.opener가 없습니다.");
          }
        } catch (err) {
          console.error("메시지 전송 오류:", err);
        }
        
        setTimeout(() => {
          try {
            window.close();
          } catch (err) {
            console.error("창 닫기 오류:", err);
            document.body.innerHTML += '<p>창이 자동으로 닫히지 않으면 <a href="#" onclick="window.close()">여기를 클릭하세요</a></p>';
          }
        }, 1000);
      </script>
      <div style="text-align: center; font-family: Arial, sans-serif; margin-top: 50px;">
        <h3>로그인 완료!</h3>
        <p>이 창은 자동으로 닫힙니다...</p>
      </div>
    `);
  } catch (error) {
    console.error("카카오 로그인 오류:", error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=카카오 로그인 실패`);
  }
});

// 서버 상태 확인 엔드포인트
app.get("/", (req, res) => {
  res.json({ message: "서버가 작동중 입니다." });
});

// 인증 상태 확인 엔드포인트
app.get("/api/auth/status", optionalAuthenticateJWT, (req, res) => {
  console.log('인증 상태 요청 처리 중...');
  console.log('req.user:', req.user);
  
  if (req.user) {
    return res.json({
      status: "OK",
      authenticated: true,
      user: req.user,
    });
  } else {
    return res.json({
      authenticated: false,
    });
  }
});

// 로그인 엔드포인트
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 이메일로 사용자 찾기
    const user = await User.findOne({ email });

    // 사용자가 없거나 비밀번호가 일치하지 않는 경우
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    // JWT 토큰 생성 (액세스 토큰과 리프레시 토큰)
    const { accessToken, refreshToken } = generateTokens(user);

    // 토큰 반환
    res.json({
      accessToken,
      refreshToken,
      user: {
        userId: user._id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error("로그인 오류:", error);
    res.status(500).json({ error: "로그인 처리 중 오류가 발생했습니다." });
  }
});

// 토큰 갱신 엔드포인트 추가
app.post("/api/auth/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ error: "리프레시 토큰이 필요합니다." });
  }
  
  try {
    // 리프레시 토큰 검증
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    
    // 사용자 조회
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }
    
    // 새 토큰 발급
    const tokens = generateTokens(user);
    
    res.json(tokens);
  } catch (error) {
    console.error("토큰 갱신 오류:", error);
    res.status(403).json({ error: "유효하지 않은 토큰입니다." });
  }
});

//---------- 문의 API ----------//
// DB 연결
connectDB();

// 문의 전송 API
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  // 필수 필드 검증
  if (!name || !email || !message) {
    return res.status(400).json({ error: "모든 필드를 입력해주세요." });
  }

  try {
    // MongoDB에 문의 저장
    const contact = await Contact.create({
      name,
      email,
      message,
    });

    res.status(201).json({
      message: "문의가 성공적으로 전송되었습니다.",
      contact,
    });
  } catch (err) {
    console.error("문의 저장 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 관리자용 문의 목록 조회 API
app.get("/api/admin/contacts", isAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    console.error("문의 조회 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 관리자용 문의 읽음 표시 API
app.patch("/api/admin/contacts/:id", isAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ error: "문의를 찾을 수 없습니다." });
    }

    res.json(contact);
  } catch (err) {
    console.error("문의 업데이트 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 초기 관리자 계정 생성 함수
const createInitialAdmin = async () => {
  try {
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

// DB 연결 후 초기 관리자 계정 생성
connectDB().then(() => {
  createInitialAdmin();
});

//---------- 서버 시작 ----------//
app.listen(PORT, () => {
  console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`);
});
