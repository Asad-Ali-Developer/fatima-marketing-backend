import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ type: String, required: true })
  full_name: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: false })
  profileImage?: string;

  @Prop({ type: String, required: false })
  salary?: string;

  @Prop({ type: String, required: false })
  rokra?: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: false })
  showPassword?: string;

  @Prop({
    type: {
      role_type: {
        type: String,
        enum: ['super_admin', 'admin', 'sales_officer', 'user'],
        default: 'sales_officer',
      },
    },
    _id: false,
  })
  role?: { role_type: string };

  @Prop({
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status?: 'active' | 'inactive';

  @Prop({ type: String, enum: ['male', 'female'], required: false })
  gender?: 'male' | 'female';

  @Prop({ type: Number, min: 0, max: 100, required: false })
  commissionedBy?: number; // e.g., 65 = 65%

  @Prop({
    type: {
      id: { type: String, required: true },
      email: { type: String, required: true },
      name: { type: String, required: false },
      role: {
        type: {
          role_type: { type: String, required: true },
        },
        required: true,
        _id: false,
      },
    },
    _id: false,
    default: null,
    required: false,
  })
  created_by?: {
    id: string;
    email: string;
    name: string;
    role: { role_type: string };
  };

  // 👇 Explicitly declare timestamp fields for TS
  created_at?: Date;
  updated_at?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
