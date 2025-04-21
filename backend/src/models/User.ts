import mongoose, { Document, Schema, Model } from "mongoose";
const bcrypt = require("bcryptjs");

export interface IUser {
  userId: string;
  displayName: string;
  email: string;
  password: string;
  photo: string;
  isAdmin: boolean;
  createdAt: Date;
  lastLogin: Date;
  googleId?: string;
  lineId?: string;
  kakaoId?: string;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDocument> {}

const generateRandomId = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
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
    default: generateRandomId,
  },
  displayName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  photo: { type: String, default: "" },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  googleId: { type: String, sparse: true },
  lineId: { type: String, sparse: true },
  kakaoId: { type: String, sparse: true },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUserDocument, IUserModel>("User", userSchema);

export default User;
