import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LineStrategy } from "passport-line";
import User, { IUserDocument } from "../models/User";
import crypto from "crypto";
import { Request } from "express";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { generateTokens } from "../middleware/authMiddleware";

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
    console.warn("Google OAuth credentials are not set");
  } else {
    passport.use(
      "google",
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${BACKEND_URL}/auth/google/callback`,
          passReqToCallback: true,
        },
        async (
          req: Request,
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: any
        ) => {
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
            return done(error);
          }
        }
      )
    );
  }

  // LINE 전략 설정
  if (!process.env.LINE_CHANNEL_ID || !process.env.LINE_CHANNEL_SECRET) {
    console.warn("LINE OAuth credentials are not set");
  } else {
    passport.use(
      "line",
      new LineStrategy(
        {
          channelID: process.env.LINE_CHANNEL_ID || "",
          channelSecret: process.env.LINE_CHANNEL_SECRET || "",
          callbackURL: `${BACKEND_URL}/auth/line/callback`,
          scope: "profile openid email",
          passReqToCallback: true,
        },
        async (
          req: Request,
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: any
        ) => {
          try {
            console.log("LINE 로그인 콜백 - 프로필:", profile);

            // LINE ID를 기반으로 이메일 생성
            const email = `line_${profile.id}@line.user`;

            let user = await User.findOne({
              $or: [{ email }, { lineId: profile.id }],
            });

            if (!user) {
              const randomPassword = crypto.randomBytes(20).toString("hex");
              user = await User.create({
                email,
                displayName:
                  profile.displayName || profile._json?.name || "라인사용자",
                password: randomPassword,
                photo:
                  profile.photos?.[0]?.value || profile._json?.picture || "",
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

            // JWT 토큰 생성
            const {
              accessToken: jwtAccessToken,
              refreshToken: jwtRefreshToken,
            } = generateTokens(user);

            // 사용자 정보와 토큰을 함께 반환
            return done(null, {
              user,
              tokens: {
                accessToken: jwtAccessToken,
                refreshToken: jwtRefreshToken,
              },
            });
          } catch (error) {
            console.error("LINE 로그인 처리 중 오류:", error);
            return done(error);
          }
        }
      )
    );
  }

  // JWT 전략 설정
  passport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET || "your-secret-key",
      },
      async (jwtPayload: any, done: any) => {
        try {
          const user = await User.findById(jwtPayload.userId);
          if (!user) {
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // 세션 직렬화 설정
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  return passport;
};

export default passport;
