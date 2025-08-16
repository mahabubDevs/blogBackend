import express, { Request, Response } from "express";
import Stripe from "stripe";
import { SubscriptionService } from "./subscripton.service";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_API_SECRET as string, {
  apiVersion: "2024-06-20",
});

// ✅ Webhook route
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        // 👉 Checkout completed
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;

          const userId = session.metadata?.userId;
          const packageId = session.metadata?.packageId;
          const subscriptionId = session.subscription as string;

          if (userId && packageId && subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            await SubscriptionService.saveSubscriptionInDB({
              userId,
              packageId,
              stripeSubscriptionId: subscription.id,
              startDate: new Date(subscription.start_date * 1000),
              endDate: new Date(subscription.current_period_end * 1000),
            });

            console.log("✅ Subscription activated in DB");
          }
          break;
        }

        // 👉 Recurring invoice payment succeeded
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.subscription as string;

          if (subscriptionId) {
            await SubscriptionService.saveSubscriptionInDB({
              userId: invoice.customer_email || "",
              packageId: "",
              stripeSubscriptionId: subscriptionId,
              startDate: new Date(invoice.period_start * 1000),
              endDate: new Date(invoice.period_end * 1000),
            });

            console.log("💰 Invoice paid & DB updated");
          }
          break;
        }

        // 👉 Subscription canceled
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
      console.error("Webhook handler error:", err);
      res.status(500).send("Webhook handler failed");
    }
  }
);

export const SubscriptionRoutes = router;
