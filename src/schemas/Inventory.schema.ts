import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory {
  @Prop({ required: true, unique: true })
  registrationNumber: string;

  @Prop({
    required: true,
    enum: ['Kanal', 'Marla'],
    type: String,
  })
  areaType: 'Kanal' | 'Marla';

  @Prop({ required: true, type: Number })
  areaSize: number;

  @Prop({ required: true })
  fileType: string;

  // Ownership & audit
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

export const InventorySchema = SchemaFactory.createForClass(Inventory);
