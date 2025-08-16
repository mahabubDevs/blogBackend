import { Schema, model } from "mongoose";
import { ISubscription, SubscriptionModel } from "./subscription.interface";

const subscriptionSchema = new Schema<ISubscription, SubscriptionModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    package: { type: Schema.Types.ObjectId, ref: "Package", required: true },
    stripeSubscriptionId: { type: String, required: true },
    status: { type: String, enum: ["active", "canceled", "expired"], default: "active" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Subscription = model<ISubscription, SubscriptionModel>(
  "Subscriptionmy",
  subscriptionSchema
);
