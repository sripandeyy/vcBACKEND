import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebRtcGateway } from './webrtc.gateway';
import { Room, RoomSchema } from '../schemas/room.schema';
import { Chat, ChatSchema } from '../schemas/chat.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Room.name, schema: RoomSchema },
            { name: Chat.name, schema: ChatSchema },
        ]),
        AuthModule, // provides AuthService (and thus User model)
    ],
    providers: [WebRtcGateway],
})
export class WebRtcModule { }
