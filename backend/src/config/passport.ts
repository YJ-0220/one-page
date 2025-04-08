import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LineStrategy } from 'passport-line';
// @ts-ignore - passport-kakao 모듈에 대한 타입 정의가 없습니다.
import { Strategy as KakaoStrategy } from 'passport-kakao';
import User, { IUserDocument } from '../models/User';
import crypto from 'crypto';
import { Request } from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Passport 타입 정의
declare global {
  namespace Express {
    interface User extends IUserDocument {}
  }
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

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
  // Google OAuth 전략 설정
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth credentials are not set');
  } else {
    passport.use(
      "google",
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
          passReqToCallback: true,
        },
        async (req: Request, accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            console.log("Google 로그인 시도:", profile.id);
            
            const email = profile.emails?.[0]?.value;
            if (!email) {
              console.error("Google 로그인 실패: 이메일 정보 없음");
              return done(new Error("이메일 정보를 찾을 수 없습니다."));
            }

            let user = await User.findOne({ email });
            console.log("기존 사용자 검색:", email);

            if (!user) {
              console.log("새 사용자 생성:", email);
              const randomPassword = crypto.randomBytes(20).toString("hex");
              user = await User.create({
                email,
                displayName: profile.displayName,
                googleId: profile.id,
                password: randomPassword,
                isAdmin: false,
              });
            } else if (!user.googleId) {
              console.log("기존 사용자 Google ID 업데이트:", email);
              user.googleId = profile.id;
              await user.save();
            }

            console.log("Google 로그인 성공:", email);
            return done(null, user);
          } catch (error) {
            console.error("Google 로그인 처리 중 오류:", error);
            return done(error);
          }
        }
      )
    );
  }

  // LINE 전략 설정
  if (!process.env.LINE_CLIENT_ID || !process.env.LINE_CLIENT_SECRET) {
    console.warn("LINE OAuth credentials are not set");
  } else {
    console.log("LINE 전략 설정 시작");
    console.log("LINE_CLIENT_ID:", process.env.LINE_CLIENT_ID);
    console.log("LINE_CLIENT_SECRET:", process.env.LINE_CLIENT_SECRET);
    console.log("콜백 URL:", `${BACKEND_URL}/api/auth/line/callback`);

    passport.use(
      "line",
      new LineStrategy(
        {
          channelID: process.env.LINE_CLIENT_ID,
          channelSecret: process.env.LINE_CLIENT_SECRET,
          callbackURL: `${BACKEND_URL}/api/auth/line/callback`,
          passReqToCallback: true,
          scope: "profile openid email",
        },
        async (req: Request, accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            console.log("LINE 로그인 시도 - 프로필:", profile);
            console.log("LINE 로그인 시도 - 액세스 토큰:", accessToken);
            
            const email = profile.emails?.[0]?.value;
            if (!email) {
              console.error("LINE 로그인 실패: 이메일 정보 없음");
              return done(new Error("이메일 정보를 찾을 수 없습니다."));
            }

            let user = await User.findOne({
              $or: [{ email }, { lineId: profile.id }],
            });
            console.log("기존 사용자 검색 결과:", user);

            if (!user) {
              console.log("새 사용자 생성 시작");
              const randomPassword = crypto.randomBytes(20).toString("hex");
              user = await User.create({
                email,
                displayName: profile.displayName || profile.name || "라인사용자",
                password: randomPassword,
                photo: profile.photos?.[0]?.value || "",
                isAdmin: false,
                lineId: profile.id,
              });
              console.log("새 사용자 생성 완료:", user);
            } else if (!user.lineId) {
              console.log("기존 사용자 LINE ID 업데이트 시작");
              user = await User.findByIdAndUpdate(
                user._id,
                { lineId: profile.id },
                { new: true }
              );
              console.log("기존 사용자 LINE ID 업데이트 완료:", user);
            }

            console.log("LINE 로그인 성공:", user);
            return done(null, user);
          } catch (error) {
            console.error("LINE 로그인 처리 중 오류:", error);
            return done(error);
          }
        }
      )
    );
    console.log("LINE 전략 설정 완료");
  }

  // Kakao 전략 설정
  if (!process.env.KAKAO_CLIENT_ID || !process.env.KAKAO_CLIENT_SECRET) {
    console.warn('Kakao OAuth credentials are not set');
  } else {
    passport.use(
      new KakaoStrategy(
        {
          clientID: process.env.KAKAO_CLIENT_ID,
          clientSecret: process.env.KAKAO_CLIENT_SECRET,
          callbackURL: `${BACKEND_URL}/api/auth/kakao/callback`,
          passReqToCallback: true,
        },
        async (req: Request, accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            console.log("Kakao 로그인 시도:", profile.id);
            
            const email = profile.emails?.[0]?.value;
            if (!email) {
              console.error("Kakao 로그인 실패: 이메일 정보 없음");
              return done(new Error("이메일 정보를 찾을 수 없습니다."));
            }

            let user = await User.findOne({
              $or: [{ email }, { kakaoId: profile.id }],
            });
            console.log("기존 사용자 검색:", email);

            if (!user) {
              console.log("새 사용자 생성:", email);
              user = await User.create({
                displayName: profile.displayName || profile.username || "카카오사용자",
                email,
                password: Math.random().toString(36).substring(2) + Date.now().toString(36),
                photo: profile.photos?.[0]?.value || "",
                isAdmin: false,
                kakaoId: profile.id,
              });
            } else if (!user.kakaoId) {
              console.log("기존 사용자 Kakao ID 업데이트:", email);
              user = await User.findByIdAndUpdate(
                user._id,
                { kakaoId: profile.id },
                { new: true }
              );
            }

            console.log("Kakao 로그인 성공:", email);
            return done(null, user);
          } catch (error) {
            console.error("Kakao 로그인 처리 중 오류:", error);
            return done(error);
          }
        }
      )
    );
  }

  console.log("등록된 passport 전략 목록:", Object.keys((passport as any)._strategies));

  return passport;
};

export default passport; 