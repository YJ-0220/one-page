import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';

// 사용자 문서 인터페이스 정의
export interface IUser {
  userId: string;  // 랜덤 생성된 사용자 ID
  displayName: string;
  email: string;
  password: string;
  photo: string;
  isAdmin: boolean;
  createdAt: Date;
  lastLogin: Date;
  googleId?: string; // 구글 소셜 로그인 ID
  lineId?: string;   // 라인 소셜 로그인 ID
  kakaoId?: string;  // 카카오 소셜 로그인 ID
}

// 메서드를 포함한 사용자 문서 인터페이스
export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// 사용자 모델 인터페이스 (정적 메서드가 필요하면 여기에 추가)
export interface IUserModel extends Model<IUserDocument> {
  // 정적 메서드가 있다면 여기에 정의
}

// 랜덤 ID 생성 함수
const generateRandomId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const userSchema = new Schema<IUserDocument>({
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    default: generateRandomId 
  },
  displayName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  photo: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  googleId: { type: String, sparse: true },
  lineId: { type: String, sparse: true },
  kakaoId: { type: String, sparse: true }
});

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;