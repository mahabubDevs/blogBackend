import { Model, Types } from "mongoose";

export interface ISubscription {
  user: Types.ObjectId;
  package: Types.ObjectId;
  stripeSubscriptionId: string;
  status: "active" | "canceled" | "expired" | "pending"; // Stripe-এর incomplete status map করে pending
  startDate: Date;
  endDate: Date;
  paymentStatus?: "paid" | "unpaid" | "incomplete"; // Optional for tracking payment state
  createdAt?: Date;
  updatedAt?: Date;
}

export type SubscriptionModel = Model<ISubscription, Record<string, unknown>>;
