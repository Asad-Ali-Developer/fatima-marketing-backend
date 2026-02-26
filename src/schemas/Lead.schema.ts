import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { LeadStatus } from 'src/DTOs';

export type LeadDocument = HydratedDocument<Lead>;

@Schema({ timestamps: true })
export class Lead {

  _id?: string; // Explicitly define _id for clarity

  @Prop({ required: true })
  userName: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  location?: string;

  @Prop()
  invoice_id?: string;

  @Prop({ required: true })
  time: Date; // stored as Date in DB

  @Prop({
    type: String,
    enum: LeadStatus,
    default: LeadStatus.PENDING,
  })
  status: LeadStatus;

  @Prop()
  remarks?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({
    type: {
      id: { type: String, required: false },
      email: { type: String, required: false },
      full_name: { type: String, required: false },
    },
    _id: false, // prevents Mongoose from auto-adding _id to this subdoc
    required: false,
  })
  assignedTo?: {
    id: string;
    email: string;
    full_name: string;
  };

  @Prop({
    type: {
      id: { type: String, required: true },
      email: { type: String, required: true },
      full_name: { type: String, required: true },
    },
    _id: false, // prevents Mongoose from auto-adding _id to this subdoc
    required: true,
  })
  createdBy?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export const leadSchema = SchemaFactory.createForClass(Lead);
