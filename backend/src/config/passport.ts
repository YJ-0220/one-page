import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LineStrategy } from "passport-line";
import User, { IUserDocument } from "../models/User";
import crypto from "crypto";
import { Request } from "express";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { generateTokens } from "../middleware/authMiddleware";
import dotenv from "dotenv";
import path from "path";

// Passport 타입 정의
declare global {
  namespace Express {
    interface User extends IUserDocument {}
  }
}

// 환경변수 로드
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// 필수 환경변수 검증
const requiredEnvVars = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "LINE_CHANNEL_ID",
  "LINE_CHANNEL_SECRET",
  "BACKEND_URL",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`필수 환경변수 ${envVar}가 설정되지 않았습니다.`);
    process.exit(1);
  }
}

const BACKEND_URL = process.env.BACKEND_URL as string;

// 콜백 URL 검증 함수
const validateCallbackUrl = (provider: string, callbackUrl: string) => {
  if (!callbackUrl.startsWith(BACKEND_URL)) {
    throw new Error(`Invalid callback URL for ${provider}: ${callbackUrl}`);
  }
};

// Passport 설정
passport.serializeUser((user: Express.User, done) => {
  done(null, user);
});

passport.deserializeUser((user: Express.User, done) => {
  done(null, user);
});

export const configurePassport = () => {
  // Google OAuth 전략
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${BACKEND_URL}/auth/google/callback`,
          scope: ['profile', 'email'],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              console.error("Google 로그인 실패: 이메일 정보 없음");
              return done(new Error("이메일 정보를 찾을 수 없습니다."));
            }

            let user = await User.findOne({ email });

            if (!user) {
              const randomPassword = crypto.randomBytes(20).toString("hex");
              user = await User.create({
                email,
                displayName: profile.displayName,
                googleId: profile.id,
                password: randomPassword,
                isAdmin: false,
              });
            } else if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }

            return done(null, user);
          } catch (error) {
            console.error("Google 로그인 처리 중 오류:", error);
            return done(error as Error);
          }
        }
      )
    );
  }

  // Line OAuth 전략
  if (process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET) {
    passport.use(
      new LineStrategy(
        {
          channelID: process.env.LINE_CHANNEL_ID!,
          channelSecret: process.env.LINE_CHANNEL_SECRET!,
          callbackURL: `${process.env.BACKEND_URL}/auth/line/callback`,
          scope: 'profile openid email'
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            let user = await User.findOne({ 'line.id': profile.id });
            
            if (!user) {
              user = await User.create({
                line: {
                  id: profile.id,
                  accessToken
                },
                displayName: profile.displayName,
                email: profile.emails?.[0]?.value,
                isAdmin: false
              });
            }
            
            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  // JWT 전략
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET이 설정되지 않았습니다.');
  }

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
      },
      async (payload: any, done: any) => {
        try {
          const user = await User.findById(payload.userId);
          if (!user) {
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  return passport;
};

export default passport;
