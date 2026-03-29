import { Controller, Post, Patch, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  async sendOtp(@Body('email') email: string) {
    if (!email) throw new Error('Email is required');
    return this.authService.sendOtp(email);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    if (!body.email || !body.otp) throw new Error('Email and OTP are required');
    return this.authService.verifyOtp(body.email, body.otp);
  }

  /**
   * Called from next-auth Google callback to persist Google user to DB.
   */
  @Post('google-upsert')
  async googleUpsert(@Body() profile: { email: string; name?: string; image?: string }) {
    if (!profile.email) throw new Error('Email required');
    const user = await this.authService.upsertGoogleUser(profile);
    return { success: true, user };
  }

  /**
   * Update a user's profile (name, phone, bio, location).
   */
  @Patch('profile')
  async updateProfile(@Body() body: { email: string; name?: string; phone?: string; bio?: string; location?: string }) {
    if (!body.email) throw new Error('Email required');
    const { email, ...updates } = body;
    const user = await this.authService.updateProfile(email, updates);
    return { success: true, user };
  }
}
