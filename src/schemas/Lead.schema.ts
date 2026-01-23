import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { LeadStatus } from 'src/DTOs';

export type LeadDocument = HydratedDocument<Lead>;

@Schema({ timestamps: true })
export class Lead {
  @Prop({ required: true })
  userName: string;

  @Prop()
  location?: string;

  @Prop({ required: true })
  time: Date; // stored as Date in DB

  @Prop({
    type: String,
    enum: LeadStatus,
    default: LeadStatus.PENDING,
  })
  status: LeadStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

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
  assignedTo: {
    id: string;
    email: string;
    full_name: string;
  };
}

export const leadSchema = SchemaFactory.createForClass(Lead);
