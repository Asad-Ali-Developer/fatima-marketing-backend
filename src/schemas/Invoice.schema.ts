import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Lead, leadSchema } from './Lead.schema';

export type InvoiceDocument = HydratedDocument<Invoice>;

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

  @Prop()
  invoice_number?: string;

  @Prop()
  quantity?: string;

  @Prop()
  description?: string;

  @Prop()
  lead_id?: string;

  @Prop()
  property_type?: string;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({
    required: true,
    enum: ['pending', 'received_so', 'completed'],
    default: 'pending',
  })
  status: 'pending' | 'received_so' | 'completed';

  @Prop({
    type: {
      id: { type: String, required: true },
      email: { type: String, required: true },
      name: { type: String, required: true },
    },
    _id: false,
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
      approved_at: {
        type: Date,
        default: null,
      },
    },
    _id: false,
    required: true,
  })
  reported_to: {
    id: string;
    email: string;
    name: string;
    admin_approval_status: 'pending' | 'approved' | 'rejected';
    approved_at: Date | null;
  };

  @Prop({ type: leadSchema, _id: false })
  generatedByLead?: Lead;

  // Don't manually define _id.
  // Mongoose automatically creates:
  // _id: Types.ObjectId

  // timestamps: true automatically creates these.
  createdAt?: Date;
  updatedAt?: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

export const typedInvoiceSchema =
  InvoiceSchema as unknown as MongooseSchema<InvoiceDocument>;
