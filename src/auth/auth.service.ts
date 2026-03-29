import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Otp, OtpDocument } from '../schemas/otp.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendOtp(email: string) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await this.otpModel.deleteMany({ email });
      const newOtp = new this.otpModel({ email, otp });
      await newOtp.save();

      const mailOptions = {
        from: this.configService.get<string>('EMAIL_USER'),
        to: email,
        subject: 'Your Login OTP - Video Chat Room',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #09090b; color: #fff; padding: 32px; border-radius: 16px;">
            <h2 style="color: #a855f7; margin-bottom: 8px;">ChatRoom Login</h2>
            <p style="color: #a1a1aa;">Your secure one-time login code is:</p>
            <div style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #fff; background: #18181b; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">${otp}</div>
            <p style="color: #71717a; font-size: 13px;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
          </div>`,
      };

      await this.transporter.sendMail(mailOptions);
      return { success: true, message: 'OTP sent successfully!' };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new InternalServerErrorException('Could not send OTP email. Check EMAIL_USER and EMAIL_PASS env vars.');
    }
  }

  async verifyOtp(email: string, otp: string) {
    const validOtp = await this.otpModel.findOne({ email, otp });
    if (!validOtp) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }
    await this.otpModel.deleteMany({ email });

    // Upsert: create if new, update lastSeenAt on every login
    const derivedName = email.split('@')[0];
    let user = await this.userModel.findOneAndUpdate(
      { email },
      {
        $setOnInsert: { email, name: derivedName, authProvider: 'email' },
        $set: { isEmailVerified: true, lastSeenAt: new Date() },
      },
      { upsert: true, new: true },
    );

    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name || derivedName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  /**
   * Called when a user signs in via Google OAuth (next-auth callback).
   * Creates or updates the user record with Google profile data.
   */
  async upsertGoogleUser(profile: { email: string; name?: string; image?: string }) {
    const user = await this.userModel.findOneAndUpdate(
      { email: profile.email },
      {
        $setOnInsert: { email: profile.email, authProvider: 'google' },
        $set: {
          name: profile.name,
          avatarUrl: profile.image,
          isEmailVerified: true,
          lastSeenAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
    return user;
  }

  /**
   * Appends a call log entry directly to the user document.
   */
  async recordCallLog(email: string, roomId: string) {
    if (!email || !email.includes('@')) return;
    await this.userModel.findOneAndUpdate(
      { email },
      {
        $push: { callHistory: { roomId, joinedAt: new Date() } },
        $set: { lastSeenAt: new Date() },
      },
    );
  }

  /**
   * Update profile fields (name, phone, bio, location) for a given user.
   */
  async updateProfile(email: string, updates: { name?: string; phone?: string; bio?: string; location?: string }) {
    return this.userModel.findOneAndUpdate(
      { email },
      { $set: updates },
      { new: true },
    );
  }
}
