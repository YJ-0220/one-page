export interface AuthUser {
  _id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}
