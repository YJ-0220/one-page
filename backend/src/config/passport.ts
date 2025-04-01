import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LineStrategy } from 'passport-line';
// @ts-ignore - passport-kakao 모듈에 대한 타입 정의가 없습니다.
import { Strategy as KakaoStrategy } from 'passport-kakao';
import User from '../models/User';

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export const configurePassport = () => {
  // 세션에 사용자 직렬화/역직렬화
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

  // Google OAuth 전략 설정
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
        scope: ["profile", "email"],
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || "";
          if (!email) {
            return done(new Error("이메일 정보를 가져올 수 없습니다."), undefined);
          }

          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              displayName: profile.displayName || "구글사용자",
              email,
              password: Math.random().toString(36).substring(2) + Date.now().toString(36),
              photo: profile.photos?.[0]?.value || "",
              isAdmin: false,
              googleId: profile.id,
            });
          } else if (!user.googleId) {
            user = await User.findByIdAndUpdate(
              user._id,
              { googleId: profile.id },
              { new: true }
            );
          }

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

  // LINE 전략 설정
  passport.use(
    new LineStrategy(
      {
        channelID: process.env.LINE_CHANNEL_ID as string,
        channelSecret: process.env.LINE_CHANNEL_SECRET as string,
        callbackURL: `${BACKEND_URL}/api/auth/line/callback`,
        scope: "profile openid email",
      },
      async (accessToken, refreshToken, profile: any, done) => {
        try {
          const email = profile.email || `line_${profile.id}@example.com`;
          let user = await User.findOne({
            $or: [{ email }, { lineId: profile.id }],
          });

          if (!user) {
            user = await User.create({
              displayName: profile.displayName || profile.name || "라인사용자",
              email,
              password: Math.random().toString(36).substring(2) + Date.now().toString(36),
              photo: profile.pictureUrl || "",
              isAdmin: false,
              lineId: profile.id,
            });
          } else if (!user.lineId) {
            user = await User.findByIdAndUpdate(
              user._id,
              { lineId: profile.id },
              { new: true }
            );
          }

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

  // Kakao 전략 설정
  if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
    passport.use(
      new KakaoStrategy(
        {
          clientID: process.env.KAKAO_CLIENT_ID as string,
          clientSecret: process.env.KAKAO_CLIENT_SECRET as string,
          callbackURL: `${BACKEND_URL}/api/auth/kakao/callback`,
        },
        async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
          try {
            const email = profile._json?.kakao_account?.email || `kakao_${profile.id}@example.com`;
            let user = await User.findOne({
              $or: [{ email }, { kakaoId: profile.id }],
            });

            if (!user) {
              user = await User.create({
                displayName: profile.displayName || profile.username || "카카오사용자",
                email,
                password: Math.random().toString(36).substring(2) + Date.now().toString(36),
                photo: profile._json?.properties?.profile_image || "",
                isAdmin: false,
                kakaoId: profile.id,
              });
            } else if (!user.kakaoId) {
              user = await User.findByIdAndUpdate(
                user._id,
                { kakaoId: profile.id },
                { new: true }
              );
            }

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
  } else {
    console.warn("KAKAO_CLIENT_ID 또는 KAKAO_CLIENT_SECRET 환경 변수가 설정되지 않아 카카오 로그인이 비활성화됩니다.");
  }

  return passport;
}; 