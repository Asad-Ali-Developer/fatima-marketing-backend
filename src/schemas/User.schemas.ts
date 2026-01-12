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

//   @Prop({ type: String, default: 'admin' })
//   role?: string;

//   @Prop({ type: String, default: null })
//   profile_picture?: string;

//   @Prop({ type: String, default: null })
//   phone_number?: string;

}

export const UserSchema = SchemaFactory.createForClass(User);
