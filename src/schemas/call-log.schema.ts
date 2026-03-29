import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CallLogDocument = HydratedDocument<CallLog>;

@Schema({ timestamps: true })
export class CallLog {
  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  roomId: string;

  @Prop({ required: true })
  joinedAt: Date;

  @Prop()
  leftAt?: Date;
}

export const CallLogSchema = SchemaFactory.createForClass(CallLog);
