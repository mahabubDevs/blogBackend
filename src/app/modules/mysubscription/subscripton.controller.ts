import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { SubscriptionService } from "./subscripton.service";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { Subscription } from "./subscription.model";
import { IUser } from "../user/user.interface";
import { Types } from "mongoose";

export const SubscriptionController = {
  // subscription.controller.ts
create: catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user;
  console.log("Auth User:", authUser);

  if (!authUser || !authUser.id) {
    return res.status(401).json({ message: "Unauthorized: user not found in token" });
  }

  // Fetch the full user object from the database to satisfy the type requirement
  const user = await import("../user/user.model").then(m => m.User.findById(authUser.id));
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { packageId } = req.body;

  const subscription = await SubscriptionService.createSubscription(
    user,
    packageId
  );

  res.status(201).json({
    success: true,
    message: "Checkout session created",
    data: subscription,
  });
}),


  subscriptions: catchAsync(async (_req: Request, res: Response) => {
    const data = await Subscription.find().populate("user package");
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "All subscriptions fetched",
      data,
    });
  }),

  subscriptionDetails: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const data = await Subscription.findOne({ user: userId }).populate("package");
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "User subscription details",
      data,
    });
  }),

  companySubscriptionDetails: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await Subscription.findById(id).populate("package user");
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Company subscription details",
      data,
    });
  }),
};
