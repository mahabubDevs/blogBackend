import { Request, Response } from 'express';
import Stripe from 'stripe';
import colors from 'colors';
import {
    handleAccountUpdatedEvent,
    handleSubscriptionCreated,
    handleSubscriptionDeleted,
    handleSubscriptionUpdated,
} from '../handlers';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../shared/logger';
import config from '../config';
import ApiError from '../errors/ApiErrors';
import stripe from '../config/stripe';

const handleStripeWebhook = async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = config.stripe.webhookSecret as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
        console.error("❌ Webhook verification failed:", error);
        return res.status(400).send(`Webhook Error: ${(error as Error).message}`);
    }

    const data = event.data.object as Stripe.Subscription | Stripe.Account;
    const eventType = event.type;

    try {
        switch (eventType) {
            case 'customer.subscription.created':
                await handleSubscriptionCreated(data as Stripe.Subscription);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(data as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(data as Stripe.Subscription);
                break;

            case 'account.updated':
                await handleAccountUpdatedEvent(data as Stripe.Account);
                break;

            default:
                logger.warn(colors.bgGreen.bold(`Unhandled event type: ${eventType}`));
        }
    } catch (error) {
        console.error("❌ Error handling event:", error);
        return res.status(500).send(`Webhook handler failed: ${(error as Error).message}`);
    }

    return res.status(200).send({ received: true });
};


export default handleStripeWebhook;