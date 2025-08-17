import stripe from "../../../config/stripe";
import { Request, Response } from "express";
import { User } from "../user/user.model"; // 👈 User model import

export const AdminController = {
  createStripeAccount: async (req: Request, res: Response) => {
    try {
      const authUser = req.user; // JWT থেকে আসা data (id/email/role)

      // 1) DB থেকে admin user খুঁজে বের করো (id ব্যবহার করে)
      const admin = await User.findById(authUser?.id);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // 2) Stripe connected account create
      const account = await stripe.accounts.create({
        type: "express",
        email: admin.email,
        capabilities: {
          transfers: { requested: true },
        },
      });

      // 3) DB তে stripeAccountId save করো
      await User.findByIdAndUpdate(
  admin._id,
  { stripeAccountId: account.id },
  { new: true } // updated doc ফেরত চাইলে
);

      // 4) Generate onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: "http://localhost:3000/reauth",
        return_url: "http://localhost:3000/dashboard",
        type: "account_onboarding",
      });

      res.json({ url: accountLink.url });
    } catch (error) {
      console.error("Stripe Account Create Error:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  },
};
