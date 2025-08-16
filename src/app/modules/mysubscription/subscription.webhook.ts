import { Request, Response } from "express";
import Stripe from "stripe";
import { Subscription } from "./subscription.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      { status: "canceled" }
    );
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    if (subscription.status === "active") {
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { status: "active" }
      );
    }
  }

  res.json({ received: true });
};
