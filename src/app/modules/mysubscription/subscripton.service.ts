import { Subscription } from "./subscription.model";
import { Package } from "../package/package.model";
import { IUser } from "../user/user.interface";
import stripe from "../../../config/stripe";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

export const SubscriptionService = {
  /**
   * Create a subscription for the logged-in user
   */
  async createSubscription(
    user: IUser & { _id: Types.ObjectId },
    packageId: string
  ) {
    // Step 1: Find package from DB
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Package not found");
    }
    if (!pkg.priceId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Package does not have a priceId"
      );
    }

    // Step 2: Create Stripe Customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
    });

    // Step 3: Create Stripe Subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: pkg.priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    // Step 4: Save subscription to DB
    const startDate = new Date(stripeSubscription.start_date * 1000);
    const endDate = new Date(stripeSubscription.current_period_end * 1000);

    const subscriptionDoc = await Subscription.create({
      user: user._id,
      package: pkg._id,
      stripeSubscriptionId: stripeSubscription.id,
      status: "active", // তোমার enum থাকলে সেটা use করো
      startDate,
      endDate,
    });

    return subscriptionDoc;
  },

  /**
   * Save subscription in DB (useful for webhooks)
   */
  async saveSubscriptionInDB(data: {
    userId: string;
    packageId: string;
    stripeSubscriptionId: string;
    startDate: Date;
    endDate: Date;
  }) {
    return Subscription.create({
      user: data.userId,
      package: data.packageId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      startDate: data.startDate,
      endDate: data.endDate,
      status: "active",
    });
  },

  /**
   * Cancel a subscription
   */
  async cancelSubscription(stripeSubscriptionId: string) {
    await stripe.subscriptions.cancel(stripeSubscriptionId);

    return Subscription.findOneAndUpdate(
      { stripeSubscriptionId },
      { status: "canceled" },
      { new: true }
    );
  },
};
