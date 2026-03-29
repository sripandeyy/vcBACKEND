import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class CallLogEntry {
  @Prop({ required: true })
  roomId: string;

  @Prop({ required: true })
  joinedAt: Date;

  @Prop()
  leftAt?: Date;
}

export const CallLogEntrySchema = SchemaFactory.createForClass(CallLogEntry);

@Schema({ timestamps: true })
export class User {
  // --- Identity ---
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ trim: true })
  name?: string;

  @Prop()
  avatarUrl?: string;

  // --- Auth Flags ---
  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: 'email', enum: ['email', 'google'] })
  authProvider: string;

  // --- Contact / Profile ---
  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  bio?: string;

  @Prop({ trim: true })
  location?: string;

  // --- Activity ---
  @Prop({ type: [CallLogEntrySchema], default: [] })
  callHistory: CallLogEntry[];

  @Prop()
  lastSeenAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
