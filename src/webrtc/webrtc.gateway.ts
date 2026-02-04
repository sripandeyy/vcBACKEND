import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayInit,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from '../schemas/room.schema';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class WebRtcGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('WebRtcGateway');

    constructor(@InjectModel(Room.name) private roomModel: Model<RoomDocument>) { }

    // Keep track of users in rooms
    private rooms: Map<string, Set<string>> = new Map();

    @SubscribeMessage('join-room')
    async handleJoinRoom(client: Socket, payload: { roomId: string; userId: string; userName: string }): Promise<void> {
        const { roomId, userId, userName } = payload;
        client.join(roomId);

        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId)?.add(client.id);

        let activeParticipants: any[] = [];

        // Save to Database
        try {
            let room = await this.roomModel.findOne({ roomId });
            if (!room) {
                room = new this.roomModel({
                    roomId,
                    participants: [],
                });
            }

            // Check if user already exists in participants
            const existingParticipantIndex = room.participants.findIndex(p => p.userId === userId);
            if (existingParticipantIndex !== -1) {
                // Update active socket id
                room.participants[existingParticipantIndex].socketId = client.id;
                // We need to mark this path as modified for array updates if it's a mixed type, but here it is defined schema.
                // Mongoose should detect change if we access via index or find. 
            } else {
                room.participants.push({
                    userId,
                    userName,
                    socketId: client.id,
                    joinedAt: new Date(),
                });
            }
            await room.save();
            this.logger.log(`Room data saved for ${roomId}`);

            // Prepare active participants list with names
            const roomSet = this.rooms.get(roomId);
            if (roomSet) {
                activeParticipants = room.participants
                    .filter(p => roomSet.has(p.socketId) && p.socketId !== client.id)
                    .map(p => ({ socketId: p.socketId, userName: p.userName }));
            }

        } catch (error) {
            this.logger.error(`Error saving room data: ${error.message}`);
            // Fallback
            const roomSet = this.rooms.get(roomId);
            activeParticipants = roomSet ? Array.from(roomSet).filter(id => id !== client.id).map(id => ({ socketId: id, userName: 'Remote User' })) : [];
        }

        this.logger.log(`User ${userName} (${userId}) joined room ${roomId}`);

        // Notify others in the room
        client.to(roomId).emit('user-joined', {
            socketId: client.id,
            userId,
            userName
        });

        // Send the list of existing users to the newcomer
        client.emit('all-users', activeParticipants);
    }

    @SubscribeMessage('signal')
    handleSignal(client: Socket, payload: { signal: any; to: string }): void {
        const { signal, to } = payload;
        this.server.to(to).emit('signal', {
            signal,
            from: client.id
        });
    }

    @SubscribeMessage('send-message')
    handleMessage(client: Socket, payload: { roomId: string; message: any }): void {
        const { roomId, message } = payload;
        this.server.to(roomId).emit('receive-message', {
            ...message,
            socketId: client.id,
            timestamp: new Date().toISOString()
        });
    }

    @SubscribeMessage('whiteboard-draw')
    handleDraw(client: Socket, payload: { roomId: string; data: any }): void {
        client.to(payload.roomId).emit('whiteboard-draw', payload.data);
    }

    @SubscribeMessage('video-action')
    handleVideoAction(client: Socket, payload: { roomId: string; action: string; data: any }): void {
        this.logger.log(`Video action received in room ${payload.roomId}: ${payload.action}`);
        client.to(payload.roomId).emit('video-action', payload);
    }

    afterInit(server: Server) {
        this.logger.log('WebRtc Signaling Server Initialized');
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.rooms.forEach((users, roomId) => {
            if (users.has(client.id)) {
                users.delete(client.id);
                this.server.to(roomId).emit('user-left', { socketId: client.id });
            }
        });
    }

    handleConnection(client: Socket, ...args: any[]) {
        this.logger.log(`Client connected: ${client.id}`);
    }
}
