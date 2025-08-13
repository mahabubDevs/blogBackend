// src/app/modules/post/post.interface.ts
import { Types } from 'mongoose';

export interface IPost {
  title: string;
  content: string;
  tags?: string[];
  image?: string;
  author: Types.ObjectId; // reference to User
  createdAt?: Date;
  updatedAt?: Date;
}
