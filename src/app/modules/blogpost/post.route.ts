// src/app/modules/post/post.route.ts
import express from "express";
import { PostController } from "./post.controller";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { PostValidation } from "./post.validation";
import { USER_ROLES } from "../../../enums/user";
import fileUploadHandler from "../../middlewares/fileUploaderHandler";
import { validateFormData } from "../../middlewares/validateFormData";

const router = express.Router();

// protected route - create post (any logged in user)
router.post(
  "/create",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  fileUploadHandler(),
  validateFormData(PostValidation.createPostZodSchema),
  PostController.createPost
);

// public routes
router.get("/", PostController.getAllPosts);
router.get("/:id", PostController.getSinglePost);

export const PostRoutes = router;
