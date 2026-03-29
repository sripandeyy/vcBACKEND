import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class ApiService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /** Returns the full user profile including embedded callHistory */
  async getUserProfile(email: string) {
    if (!email) return null;
    return this.userModel.findOne({ email }).select('-__v').exec();
  }

  /** Returns only the callHistory array, sorted newest-first */
  async getUserHistory(email: string) {
    if (!email) return [];
    const user = await this.userModel.findOne({ email }).select('callHistory').exec();
    if (!user) return [];
    return user.callHistory.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()).slice(0, 50);
  }

  /** Admin: returns all users */
  async getAllUsers() {
    return this.userModel.find().select('-__v').exec();
  }
}
