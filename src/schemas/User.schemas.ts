import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User extends Document {
  @Prop({ type: String, required: true })
  full_name: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: true })
  showPassword: string;

  @Prop({
    type: {
      role_type: {
        type: String,
        enum: ['super_admin', 'admin', 'sales_officer', 'user'],
        default: 'sales_officer',
      },
    },
    _id: false, // prevents Mongoose from auto-adding _id to this subdoc
  })
  role?: { role_type: string };

  @Prop({
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status?: 'active' | 'inactive';

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
    required: true,
  })
  created_by?: {
    id: string;
    email: string;
    name: string;
    role: { role_type: string };
  };
    // 👇 Add these for TypeScript compatibility
  @Prop({ type: Date, default: () => new Date() })
  createdAt?: Date;

  @Prop({ type: Date, default: () => new Date() })
  updatedAt?: Date;
}


export const UserSchema = SchemaFactory.createForClass(User);
