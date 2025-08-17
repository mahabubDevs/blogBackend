import { Schema, model } from "mongoose";
import { ISubscription, SubscriptionModel } from "./subscription.interface";

const subscriptionSchema = new Schema<ISubscription, SubscriptionModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    package: { type: Schema.Types.ObjectId, ref: "Package", required: true },
    stripeSubscriptionId: { type: String }, // filled after checkout completion
    stripeSessionId: { type: String }, // store checkout session id
    status: {
      type: String,
      enum: ["pending", "active", "canceled", "expired"],
      default: "pending",
    },
    startDate: { type: Date },
    endDate: { type: Date },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid", "incomplete"],
      default: "unpaid",
    },
    adminId: { type: String }, // optional field for admin ID
  },
  { timestamps: true }
);

export const Subscription = model<ISubscription, SubscriptionModel>(
  "Subscriptionme",
  subscriptionSchema
);
