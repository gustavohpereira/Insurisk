import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RiskProfileDocument = HydratedDocument<RiskProfile>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
  },
  toObject: {
    virtuals: true,
    versionKey: false,
  },
})
export class RiskProfile {
  @Prop({ required: true, index: true })
  customerDocument: string;

  @Prop({ required: true, min: 0, max: 120 })
  age: number;

  @Prop({ required: true, min: 0, default: 0 })
  claimsHistory: number;

  @Prop({ type: [String], default: [] })
  riskFactors: string[];

  @Prop({ required: true, min: 0, max: 100 })
  score: number;

  createdAt: Date;
  updatedAt: Date;
}

export const RiskProfileSchema = SchemaFactory.createForClass(RiskProfile);
