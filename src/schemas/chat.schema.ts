import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatDocument = HydratedDocument<Chat>;

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true })
  roomId: string;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  message: string;

  createdAt?: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
