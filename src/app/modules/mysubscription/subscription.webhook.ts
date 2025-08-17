import express, { Request, Response } from "express";
import Stripe from "stripe";
import { SubscriptionService } from "./subscripton.service";

const stripe = new Stripe(process.env.STRIPE_API_SECRET as string, {
  apiVersion: "2024-06-20",
});

// Main webhook handler
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw body (route-level express.raw used below)
      sig,
      process.env.WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // ✅ First checkout success
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        const packageId = session.metadata?.packageId;
        const adminId = session.metadata?.adminId;
        const subscriptionId = session.subscription as string;

        if (userId && packageId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );

          await SubscriptionService.saveSubscriptionInDB({
            userId,
            packageId,
            adminId,
            stripeSubscriptionId: subscription.id,
            startDate: new Date(subscription.start_date * 1000),
            endDate: new Date(subscription.current_period_end * 1000),
          });

          console.log("✅ Subscription saved in DB after checkout");
        }
        break;
      }

      // ✅ Recurring invoice payment (auto-transfer already handled by Stripe)
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId && invoice.lines?.data?.length > 0) {
          const period = invoice.lines.data[0].period;

          await SubscriptionService.updateSubscriptionPeriod(
            subscriptionId,
            new Date(period.start * 1000),
            new Date(period.end * 1000)
          );

          console.log("💰 Subscription period updated in DB (renewal)");
        }
        break;
      }

      // ✅ Subscription canceled
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await SubscriptionService.cancelSubscription(subscription.id);
        console.log("🚫 Subscription canceled in DB");
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    res.status(500).send("Webhook handler failed");
  }
};

// ✅ Router setup (route-level raw body so signature works even if app uses json())
const router = express.Router();

router.post(
  "/webhook",
  (req, _res, next) => {
    // tiny log to ensure route reached with raw body
    // console.log("👉 /api/v1/subscription/webhook hit, content-type:", req.headers["content-type"]);
    next();
  },
  express.raw({ type: "application/json" }),
  stripeWebhook
);

export default router;
