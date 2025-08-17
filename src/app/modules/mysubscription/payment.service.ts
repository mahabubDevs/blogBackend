// payment.service.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_API_SECRET as string, {
  apiVersion: "2024-06-20",
});

export class PaymentService {
  static async handlePayout(
    adminStripeAccountId: string,
    amount: number // Stripe সব amount cent এ দেয়
  ) {
    try {
      // 👉 Commission calculate (ধরি 20% platform commission)
      const platformCommission = Math.round(amount * 0.2);
      const adminAmount = amount - platformCommission;

      // 👉 Admin এর connected account এ transfer
      await stripe.transfers.create({
        amount: adminAmount,
        currency: "usd",
        destination: adminStripeAccountId,
      });

      // 👉 TODO: চাইলে এখান থেকে platformCommission তোমার SuperAdmin account এ আলাদা করে log/save করতে পারো

      return {
        adminAmount,
        platformCommission,
      };
    } catch (error) {
      console.error("❌ Payout failed:", error);
      throw error;
    }
  }
}
