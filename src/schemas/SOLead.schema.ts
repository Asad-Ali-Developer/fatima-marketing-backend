import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SOLeadStatus } from 'src/DTOs';

export type SOLeadDocument = HydratedDocument<SOLead>;

@Schema({ timestamps: true })
export class SOLead {

  _id?: string; // Explicitly define _id for clarity

  @Prop({ required: true })
  userName: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  location?: string;

  @Prop({ required: true })
  time: Date; // stored as Date in DB

  @Prop({ required: false })
  invoice_id?: string; // stored as string in DB

  @Prop({
    type: String,
    enum: SOLeadStatus,
    default: SOLeadStatus.PENDING,
  })
  status: SOLeadStatus;

  @Prop()
  remarks?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

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

export const SOLeadSchema = SchemaFactory.createForClass(SOLead);
