/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: string;
  payload: any;
  ip: string;
  createdAt: Date;
}

const AdminLogSchema = new Schema<IAdminLog>({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  payload: { type: Schema.Types.Mixed },
  ip: { type: String },
}, { timestamps: true });

export const AdminLog = mongoose.model<IAdminLog>('AdminLog', AdminLogSchema);