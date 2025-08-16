import { Model, Types } from "mongoose";

export interface ISubscription {
  user: Types.ObjectId;
  package: Types.ObjectId;
  stripeSubscriptionId?: string;
  stripeSessionId?: string;
  status: "pending" | "active" | "canceled" | "expired";
  startDate?: Date;
  endDate?: Date;
  paymentStatus?: "paid" | "unpaid" | "incomplete";
  createdAt?: Date;
  updatedAt?: Date;
}

export type SubscriptionModel = Model<ISubscription>;
