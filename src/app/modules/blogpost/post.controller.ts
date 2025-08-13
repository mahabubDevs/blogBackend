// src/app/modules/post/post.controller.ts
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PostService } from "./post.service";
import { getSingleFilePath } from "../../../shared/getFilePath";

const createPost = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;

  // Image file path
  const imagePath = getSingleFilePath(req.files, "image");

  const payload = {
    ...req.body, // validateFormData এর পরে এখানে title, content, tags থাকবে
    image: imagePath,
    author: user.id,
  };

  const result = await PostService.createPostToDB(payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Post created successfully",
    data: result,
  });
})




const getAllPosts = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);

  const result = await PostService.getAllPostsFromDB(page, limit);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Posts fetched successfully",
    data: result,
  });
});

const getSinglePost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PostService.getSinglePostFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Post fetched successfully",
    data: result,
  });
});

export const PostController = {
  createPost,
  getAllPosts,
  getSinglePost,
};
