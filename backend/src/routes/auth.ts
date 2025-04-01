import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import axios from 'axios';
import { authenticateJWT, optionalAuthenticateJWT } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// 토큰 생성 함수
export const generateTokens = (user: any) => {
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
  
  const refreshToken = jwt.sign(
    { userId: user._id },
    JWT_SECRET,
    { expiresIn: '60d' }
  );
  
  return { accessToken, refreshToken };
};

// 소셜 로그인 엔드포인트
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account',
}));

router.get('/line', passport.authenticate('line'));

router.get('/kakao', (req, res) => {
  const kakaoAuthURL = "https://kauth.kakao.com/oauth/authorize";
  const redirect_uri = `${BACKEND_URL}/api/auth/kakao/callback`;
  res.redirect(`${kakaoAuthURL}?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${redirect_uri}&response_type=code`);
});

// 콜백 처리
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: `${CLIENT_URL}/login`, session: false }),
  (req, res) => {
    const user = req.user as any;
    const { accessToken, refreshToken } = generateTokens(user);
    const userName = user ? user.displayName || user.email || '구글사용자' : '구글사용자';

    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'login_success',
            provider: 'google',
            token: "${accessToken}",
            refreshToken: "${refreshToken}",
            user: "${userName}"
          }, "${CLIENT_URL}");
        }
        setTimeout(() => window.close(), 1000);
      </script>
      <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
        <h3>로그인 완료!</h3>
        <p>이 창은 자동으로 닫힙니다...</p>
      </div>
    `);
  }
);

router.get('/line/callback',
  passport.authenticate('line', { failureRedirect: `${CLIENT_URL}/login`, session: false }),
  (req, res) => {
    const user = req.user as any;
    const { accessToken, refreshToken } = generateTokens(user);
    const userName = user ? user.displayName || '라인사용자' : '라인사용자';

    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'login_success',
            provider: 'line',
            token: "${accessToken}",
            refreshToken: "${refreshToken}",
            user: "${userName}"
          }, "${CLIENT_URL}");
        }
        setTimeout(() => window.close(), 1000);
      </script>
      <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
        <h3>로그인 완료!</h3>
        <p>이 창은 자동으로 닫힙니다...</p>
      </div>
    `);
  }
);

router.get('/kakao/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const kakaoTokenURL = "https://kauth.kakao.com/oauth/token";
    const redirect_uri = `${BACKEND_URL}/api/auth/kakao/callback`;

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
    const email = profile.kakao_account?.email || `kakao_${profile.id}@example.com`;

    let user = await User.findOne({
      $or: [{ email }, { kakaoId: profile.id.toString() }],
    });

    if (!user) {
      user = await User.create({
        displayName: profile.kakao_account?.profile?.nickname || "카카오사용자",
        email,
        password: Math.random().toString(36).substring(2) + Date.now().toString(36),
        photo: profile.kakao_account?.profile?.profile_image_url || "",
        isAdmin: false,
        kakaoId: profile.id.toString(),
      });
    } else if (!user.kakaoId) {
      user = await User.findByIdAndUpdate(
        user._id,
        { kakaoId: profile.id.toString() },
        { new: true }
      );
    }

    if (!user) {
      return res.status(500).send("사용자 생성 중 오류가 발생했습니다.");
    }

    const { accessToken, refreshToken } = generateTokens(user);
    const userName = user.displayName || "카카오사용자";

    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'login_success',
            provider: 'kakao',
            token: "${accessToken}",
            refreshToken: "${refreshToken}",
            user: "${userName}"
          }, "${CLIENT_URL}");
        }
        setTimeout(() => window.close(), 1000);
      </script>
      <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
        <h3>로그인 완료!</h3>
        <p>이 창은 자동으로 닫힙니다...</p>
      </div>
    `);
  } catch (error) {
    console.error("카카오 로그인 오류:", error);
    res.redirect(`${CLIENT_URL}/login?error=카카오 로그인 실패`);
  }
});

// 인증 상태 확인
router.get('/status', optionalAuthenticateJWT, (req, res) => {
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

// 로그인
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const { accessToken, refreshToken } = generateTokens(user);
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

// 토큰 갱신
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ 
      error: "리프레시 토큰이 필요합니다.",
      code: "REFRESH_TOKEN_REQUIRED"
    });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: "사용자를 찾을 수 없습니다.",
        code: "USER_NOT_FOUND" 
      });
    }
    
    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (error) {
    if ((error as any).name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: "리프레시 토큰이 만료되었습니다.",
        code: "REFRESH_TOKEN_EXPIRED"
      });
    }
    
    res.status(403).json({ 
      error: "유효하지 않은 리프레시 토큰입니다.",
      code: "INVALID_REFRESH_TOKEN"
    });
  }
});

export default router; 