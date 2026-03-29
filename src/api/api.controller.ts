import { Controller, Get, Query } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  /** Get full user profile (call history, contact info, etc.) */
  @Get('profile')
  async getProfile(@Query('email') email: string) {
    if (!email) return { success: false, message: 'Email required' };
    const user = await this.apiService.getUserProfile(email);
    return { success: true, user };
  }

  /** Get just the call history list */
  @Get('history')
  async getHistory(@Query('email') email: string) {
    if (!email) return { success: false, message: 'Email required' };
    const history = await this.apiService.getUserHistory(email);
    return { success: true, history };
  }

  /** Admin: all users */
  @Get('admin/users')
  async getAdminUsers() {
    const users = await this.apiService.getAllUsers();
    return { success: true, users };
  }
}
