import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Lead, leadSchema } from './Lead.schema';

export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop()
  location?: string;

  @Prop()
  remarks?: string;

  @Prop()
  amount?: number;

  @Prop({ required: true, type: Date })
  date: Date; // Invoice date (not createdAt)

  @Prop({
    required: true,
    enum: ['pending', 'received_so', 'cancelled'],
    default: 'pending',
  })
  status: 'pending' | 'received_so' | 'cancelled';

  @Prop({
    type: {
      id: { type: String, required: true },
      email: { type: String, required: true },
      name: { type: String, required: true },
    },
    _id: false, // prevents Mongoose from auto-adding _id to this subdoc
    required: true,
  })
  created_by: {
    id: string;
    email: string;
    name: string;
  };

  @Prop({
    type: {
      id: { type: String, required: true },
      email: { type: String, required: true },
      name: { type: String, required: true },
      admin_approval_status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      approved_at: { type: Date, default: null },
    },
    _id: false, // prevents Mongoose from auto-adding _id to this subdoc
    required: true,
  })
  reported_to: {
    id: string;
    email: string;
    name: string;
    admin_approval_status: 'pending' | 'approved' | 'rejected';
    approved_at: Date | null;
  };

  
  // 👇 ADD THIS: Embedded Lead subdocument
  @Prop({ type: leadSchema, _id: false })
  generatedByLead?: Lead;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
