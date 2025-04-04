import mongoose, { Schema, Document } from 'mongoose';

export interface IVisitor extends Document {
  date: string;
  count: number;
  ip: string[];
}

const VisitorSchema: Schema = new Schema({
  date: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  ip: [{ type: String }]
});

export default mongoose.model<IVisitor>('Visitor', VisitorSchema);