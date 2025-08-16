import { Model } from "mongoose";

export type IPackage = {
    title: string;
    description: string;
    price: number;
    duration: '1 month' | '3 months' | '6 months' | '1 year';
    paymentType: 'Monthly' | 'Yearly';
    productId: string; // Stripe product id
    priceId: string;   // Stripe price id
    credit: number;
    loginLimit: number;
    paymentLink: string;
    status?: 'Active' | 'Delete';
};


export type PackageModel = Model<IPackage, Record<string, unknown>>;