import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExpenseDocument = Expense & Document;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  amount: number;

  // Ownership
  @Prop({
    type: {
      id: { type: String, required: false },
      email: { type: String, required: false },
      name: { type: String, required: false },
      role_type: { type: String, required: false },
    },
    _id: false,
    required: true,
  })
  created_by: {
    id: string;
    email: string;
    name: string;
    role_type: string;
  };

  // 👇 Add these for TypeScript compatibility
  @Prop({ type: Date, default: () => new Date() })
  createdAt?: Date;

  @Prop({ type: Date, default: () => new Date() })
  updatedAt?: Date;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
