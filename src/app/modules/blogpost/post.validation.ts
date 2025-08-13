// src/app/modules/post/post.validation.ts
import { z } from "zod";

export const PostValidation = {
  createPostZodSchema: z.object({
    title: z.string({ required_error: "Title is required" }).min(3),
    content: z.string({ required_error: "Content is required" }).min(10),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
  }),
};
