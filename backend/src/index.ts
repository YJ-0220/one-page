import express from "express";
import session from "express-session";
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
const MongoStore = require("connect-mongo");

// 환경 변수 로드
dotenv.config();

// 앱 및 포트 설정
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const apiUrl = `${process.env.BACKEND_API_URL}`;

//깃허브 백엔드 배포 테스트
fetch(`${apiUrl}/api/auth/status`, {
  credentials: "include",
})
  .then(res => res.json())
  .then(data => console.log(data))
  .then(err => console.error('Error:', err))

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
      "https://YJ-0220.github.io/one-page/",
    ],
    credentials: true,
  })
);

// 추가 보안 헤더 설정
app.use((req, res, next) => {
  // COOP 설정 - 팝업 창과의 통신을 위해 same-origin-allow-popups 사용
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  // COEP 설정
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60, // 세션 유효기간 14일
    }),
  })
);

//---------- Passport 설정 ----------//
app.use(passport.initialize());
app.use(passport.session());

// Passport 사용자 직렬화/역직렬화
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});

//line 전략 설정
passport.use(
  new LineStrategy(
    {
      channelID: process.env.LINE_CHANNEL_ID as string,
      channelSecret: process.env.LINE_CHANNEL_SECRET as string,
      callbackURL: `${process.env.BACKEND_URL}/auth/line/callback`,
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
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email"],
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

// 카카오 OAuth 전략 설정
app.get("/auth/kakao", (req, res) => {
  // 카카오 로그인 페이지로 리다이렉트
  const kakaoAuthURL = "https://kauth.kakao.com/oauth/authorize";
  const redirect_uri = `${process.env.BACKEND_URL}/auth/kakao/callback`;

  res.redirect(
    `${kakaoAuthURL}?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${redirect_uri}&response_type=code`
  );
});

// 카카오 콜백 처리
app.get("/auth/kakao/callback", async (req, res) => {
  const code = req.query.code;
  const kakaoTokenURL = "https://kauth.kakao.com/oauth/token";
  const redirect_uri = `${process.env.BACKEND_URL}/auth/kakao/callback`;

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

    // 로그인 처리
    req.login(user as any, (err) => {
      if (err) {
        return res.status(500).send("로그인 처리 중 오류가 발생했습니다.");
      }

      // 클라이언트로 메시지 전송
      const userName = user!.displayName || "카카오사용자";
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>로그인 완료</title></head>
        <body>
          <h3>로그인 처리 중...</h3>
          <script>
            try {
              window.opener.postMessage({
                type: 'login_success',
                provider: 'kakao',
                user: "${userName}"
              }, "${clientUrl}");
              setTimeout(() => window.close(), 300);
            } catch (err) {
              console.error("메시지 전송 오류:", err);
              window.close();
            }
          </script>
        </body>
        </html>
      `;

      res.send(html);
    });
  } catch (error) {
    console.error("카카오 로그인 오류:", error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=카카오 로그인 실패`);
  }
});

//---------- 미들웨어 함수 ----------//
// 인증 상태 확인 미들웨어
const isAuthenticated = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "인증되지 않은 요청입니다." });
};

// 관리자 권한 확인 미들웨어
const isAdmin = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.isAuthenticated() && req.user && (req.user as any).isAdmin) {
    return next();
  }
  res.status(403).json({ error: "관리자 권한이 필요합니다." });
};

//---------- 인증 관련 라우트 ----------//
// 구글 로그인 시작 엔드포인트
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account", // 항상 계정 선택 화면 표시
  })
);

//라인 연결
app.get("/auth/line", passport.authenticate("line"));

// 구글 로그인 콜백 처리 엔드포인트
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: true,
  }),
  (req, res) => {
    // 로그인 성공 후 HTML과 스크립트를 반환하여 부모 창으로 메시지 전달
    const user = req.user as any;
    const userName = user
      ? user.displayName || user.email || "구글사용자"
      : "구글사용자";
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>로그인 완료</title>
      </head>
      <body>
        <h3>로그인 처리 중...</h3>
        <script>
          try {
            // 부모 창으로 메시지 전송 - targetOrigin을 정확히 지정
            window.opener.postMessage({
              type: 'login_success',
              provider: 'google',
              user: "${userName}"
            }, "${clientUrl}");
            
            // 잠시 후 창 닫기 (부모 창에서 메시지를 받을 시간을 주기 위해)
            setTimeout(() => window.close(), 300);
          } catch (err) {
            console.error("메시지 전송 오류:", err);
            window.close();
          }
        </script>
      </body>
      </html>
    `;

    res.send(html);
  }
);

// 라인 콜백 처리
app.get(
  "/auth/line/callback",
  passport.authenticate("line", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: true,
  }),
  (req, res) => {
    const user = req.user as any;
    const userName = user ? user.displayName || "라인사용자" : "라인사용자";
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>로그인 완료</title></head>
      <body>
        <h3>로그인 처리 중...</h3>
        <script>
          try {
            window.opener.postMessage({
              type: 'login_success',
              provider: 'line',
              user: "${userName}"
            }, "${clientUrl}");
            setTimeout(() => window.close(), 300);
          } catch (err) {
            console.error("메시지 전송 오류:", err);
            window.close();
          }
        </script>
      </body>
      </html>
    `;

    res.send(html);
  }
);

// 로그인 상태 확인 엔드포인트
app.get("/api/auth/status", (req, res) => {
  if (req.isAuthenticated()) {
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

// 로그아웃 엔드포인트 (POST 방식)
app.post("/api/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "로그아웃 중 오류가 발생했습니다." });
    }
    res.json({ message: "로그아웃 성공" });
  });
});

// 로그아웃 엔드포인트 (GET 방식 - 호환성 유지)
app.get("/api/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "로그아웃 중 오류가 발생했습니다." });
    }
    res.json({ message: "로그아웃 성공" });
  });
});

// 세션 상태 확인 엔드포인트 추가
app.get("/api/auth/session-info", (req, res) => {
  if (req.session && req.session.cookie) {
    // 세션 만료까지 남은 시간 계산 (밀리초)
    const maxAge = req.session.cookie.maxAge || 0;
    const expiresAt = new Date(Date.now() + maxAge);

    res.json({
      authenticated: req.isAuthenticated(),
      sessionExpires: {
        maxAge,
        expiresAt,
        remainingTimeMinutes: Math.floor(maxAge / 60000), // 분 단위로 변환
      },
    });
  } else {
    res.json({
      authenticated: false,
      sessionExpires: null,
    });
  }
});

//---------- 사용자 정보 라우트 ----------//
// 사용자 정보 조회 엔드포인트
app.get("/api/user", isAuthenticated, (req, res) => {
  res.json(req.user);
});

// 사용자 정보 수정 API
app.put("/api/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { newUserId, currentPassword, newPassword } = req.body;
    const session = req.session as any;

    // 로그인 확인
    if (!session.user) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    // 관리자가 아니고 자신의 정보가 아닌 경우
    if (!session.user.isAdmin && session.user.id !== id) {
      return res
        .status(403)
        .json({ error: "자신의 정보만 수정할 수 있습니다." });
    }

    // 사용자 찾기
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    // ID 변경이 요청된 경우
    if (newUserId && newUserId !== user.id) {
      // ID 중복 확인
      const existingUser = await User.findOne({ id: newUserId });
      if (existingUser) {
        return res.status(400).json({ error: "이미 사용 중인 ID입니다." });
      }
      user.id = newUserId;
    }

    // 비밀번호 변경이 요청된 경우
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "현재 비밀번호를 입력해주세요." });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res
          .status(400)
          .json({ error: "현재 비밀번호가 일치하지 않습니다." });
      }
      user.password = newPassword;
    }

    await user.save();
    res.json({ message: "회원정보가 수정되었습니다." });
  } catch (error) {
    console.error("회원정보 수정 오류:", error);
    res.status(500).json({ error: "회원정보 수정 중 오류가 발생했습니다." });
  }
});

//---------- 관리자 API 라우트 ----------//
// 모든 사용자 목록 조회 (관리자만)
app.get("/api/admin/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    // 에러 처리
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 사용자 생성 (관리자만)
app.post("/api/admin/users", isAdmin, async (req, res) => {
  try {
    const { displayName, email, password, isAdmin: userIsAdmin } = req.body;

    // 필수 필드 검증
    if (!displayName || !email || !password) {
      return res.status(400).json({ error: "모든 필수 필드를 입력해주세요." });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "이미 등록된 이메일입니다." });
    }

    // 사용자 생성
    const user = await User.create({
      displayName,
      email,
      password,
      isAdmin: userIsAdmin || false,
    });

    // 비밀번호 제외하고 응답
    const userResponse = user.toObject();
    res.status(201).json({
      ...userResponse,
      password: undefined,
    });
  } catch (err) {
    console.error("사용자 생성 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 특정 사용자 조회 (관리자만)
app.get("/api/admin/users/:id", isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }
    res.json(user);
  } catch (err) {
    console.error("사용자 조회 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 사용자 정보 수정 (관리자만)
app.put("/api/admin/users/:id", isAdmin, async (req, res) => {
  try {
    const { displayName, email, isAdmin: userIsAdmin } = req.body;
    const updates: any = {};

    if (displayName) updates.displayName = displayName;
    if (email) updates.email = email;
    if (userIsAdmin !== undefined) updates.isAdmin = userIsAdmin;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    res.json(user);
  } catch (err) {
    console.error("사용자 수정 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 사용자 관리자 권한 수정 (관리자만)
app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
  try {
    // 권한 변경이 요청에 포함된 경우에만 수정
    if (req.body.isAdmin === undefined) {
      return res.status(400).json({ error: "관리자 권한 정보가 필요합니다." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin: req.body.isAdmin },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    res.json(user);
  } catch (err) {
    console.error("사용자 권한 수정 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 사용자 삭제 (관리자만)
app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    res.json({ message: "사용자가 삭제되었습니다." });
  } catch (err) {
    console.error("사용자 삭제 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

//---------- 로컬 로그인 API ----------//
// 로컬 로그인 엔드포인트
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // 이메일과 비밀번호 검증
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "이메일과 비밀번호를 모두 입력해주세요." });
  }

  try {
    // 사용자 찾기
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." });
    }

    // 비밀번호 확인
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." });
    }

    // 로그인 성공 시 사용자 세션 설정
    const userObj = user.toObject();
    req.login(
      {
        ...userObj,
        password: undefined,
      },
      async (err) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "로그인 중 오류가 발생했습니다." });
        }

        // 마지막 로그인 시간 업데이트
        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        return res.json({
          message: "로그인 성공",
          user: {
            ...userObj,
            password: undefined,
          },
        });
      }
    );
  } catch (err) {
    console.error("로그인 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
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
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  console.log(
    `구글 OAuth 콜백 URL: http://localhost:${PORT}/auth/google/callback`
  );
  console.log(
    `라인 OAuth 콜백 URL: http://localhost:${PORT}/auth/line/callback`
  );
});
