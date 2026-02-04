import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WebRtcModule } from './webrtc/webrtc.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        if (!uri) {
          throw new Error('FATAL: MONGO_URI is not defined in environment variables.');
        }
        return { uri };
      },
      inject: [ConfigService],
    }),
    WebRtcModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
