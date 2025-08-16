import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { SubscriptionController } from "./subscripton.controller";
import { stripeWebhook } from "./subscription.webhook";

const router = express.Router();

router.post(
  "/create",
  auth(USER_ROLES.USER),
  SubscriptionController.create
);

router.get(
  "/",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  SubscriptionController.subscriptions
);

router.get(
  "/details",
  auth(USER_ROLES.USER),
  SubscriptionController.subscriptionDetails
);

router.get(
  "/:id",
  auth(USER_ROLES.USER),
  SubscriptionController.companySubscriptionDetails
);

router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

export const SubscriptionRoutes = router;
