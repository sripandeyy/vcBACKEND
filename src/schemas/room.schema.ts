
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoomDocument = HydratedDocument<Room>;

@Schema()
export class Participant {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    userName: string;

    @Prop({ required: true })
    socketId: string;

    @Prop({ default: Date.now })
    joinedAt: Date;
}

const ParticipantSchema = SchemaFactory.createForClass(Participant);

@Schema()
export class Room {
    @Prop({ required: true, unique: true })
    roomId: string;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ type: [ParticipantSchema], default: [] })
    participants: Participant[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
