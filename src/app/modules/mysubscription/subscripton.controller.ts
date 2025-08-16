import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { SubscriptionService } from "./subscripton.service";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { Subscription } from "./subscription.model";
import { IUser } from "../user/user.interface";
import { Types } from "mongoose";

export const SubscriptionController = {
  create: catchAsync(async (req: Request, res: Response) => {
    // JWT middleware থেকে req.user পাওয়া দরকার
    const authUser = req.user; 

    if (!authUser || !authUser._id) {
      return res.status(401).json({ message: "Unauthorized: user not found in token" });
    }
    const { packageId } = req.body;

    // Ensure all IUser fields are present
    const user: IUser & { _id: Types.ObjectId } = {
      _id: new Types.ObjectId(authUser._id),
      name: authUser.name,
      appId: authUser.appId,
      role: authUser.role,
      contact: authUser.contact,
      email: authUser.email,
      password: authUser.password || "", // Provide a default or fetch from authUser
      location: authUser.location || "", // Provide a default or fetch from authUser
      profile: authUser.profile || {},   // Provide a default or fetch from authUser
      verified: authUser.verified ?? false, // Provide a default or fetch from authUser
    //   address: authUser.address,
    //   company: authUser.company,
      // add any other IUser fields if required
    };

    const subscription = await SubscriptionService.createSubscription(
      user,
      packageId
    );

    res.status(201).json({
      success: true,
      data: subscription
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
