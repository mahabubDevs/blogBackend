// src/app/modules/post/post.service.ts
import { Post } from "./post.model";
import { IPost } from "./post.interface";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
const createPostToDB = async (payload: IPost) => {
  // Check if author is provided
  if (!payload.author) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Author is required to create post');
  }

  const createdPost = await Post.create(payload);

  if (!createdPost) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create post');
  }

  return createdPost;
};   


const getAllPostsFromDB = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const posts = await Post.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({ path: "author", select: "name email" }) // show author name
    .lean();
  const total = await Post.countDocuments();
  return { posts, total, page, limit };
};

const getSinglePostFromDB = async (id: string) => {
  const post = await Post.findById(id)
    .populate({ path: "author", select: "name email" })
    .lean();
  if (!post) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Post not found");
  }
  return post;
};

export const PostService = {
  createPostToDB,
  getAllPostsFromDB,
  getSinglePostFromDB,
};
