import { Subscription } from "./subscription.model";
import { Package } from "../package/package.model";
import { IUser } from "../user/user.interface";
import stripe from "../../../config/stripe";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import config from "../../../config/index";

export const SubscriptionService = {
  async createSubscription(user: IUser & { _id: Types.ObjectId }, packageId: string) {
    // Step 1: Find package
    const pkg = await Package.findById(packageId);
    if (!pkg) throw new ApiError(StatusCodes.NOT_FOUND, "Package not found");
    if (!pkg.priceId) throw new ApiError(StatusCodes.BAD_REQUEST, "Package does not have a priceId");

    // Step 2: Create Stripe Customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user._id.toString() },
    });

    // Step 3: Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customer.id,
      line_items: [{ price: pkg.priceId, quantity: 1 }],
      success_url: `${config.stripe.paymentSuccess}?session_id={CHECKOUT_SESSION_ID}`,
      // cancel_url: `${config.stripe.paymentCancel}`,
      metadata: { userId: user._id.toString(), packageId: pkg._id.toString() },
    });

    // Step 4: Save pending subscription in DB
    const subscriptionDoc = await Subscription.create({
      user: user._id,
      package: pkg._id,
      status: "pending",
      stripeSessionId: session.id,
    });

    return { checkoutUrl: session.url, subscription: subscriptionDoc };
  },

  async saveSubscriptionInDB(data: {
    userId: string;
    packageId: string;
    stripeSubscriptionId: string;
    startDate: Date;
    endDate: Date;
  }) {
    return Subscription.findOneAndUpdate(
      { user: data.userId, package: data.packageId },
      {
        stripeSubscriptionId: data.stripeSubscriptionId,
        startDate: data.startDate,
        endDate: data.endDate,
        status: "active",
        paymentStatus: "paid",
      },
      { new: true }
    );
  },

  async cancelSubscription(stripeSubscriptionId: string) {
    await stripe.subscriptions.cancel(stripeSubscriptionId);
    return Subscription.findOneAndUpdate(
      { stripeSubscriptionId },
      { status: "canceled" },
      { new: true }
    );
  },
};
