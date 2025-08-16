import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import { IPackage } from "./package.interface";
import { Package } from "./package.model";
import mongoose from "mongoose";
import { createSubscriptionProduct } from "../../../helpers/createSubscriptionProductHelper";
import stripe from "../../../config/stripe";

const createPackageToDB = async (payload: IPackage): Promise<IPackage | null> => {
    const productPayload = {
        title: payload.title,
        description: payload.description,
        duration: payload.duration,
        price: Number(payload.price),
    };

    // Step 1: Create product in Stripe
    const product = await createSubscriptionProduct(productPayload);

    if (!product) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create subscription product");
    }

    // Step 2: Create price in Stripe (use productId from product creation)
    const price = await stripe.prices.create({
        unit_amount: payload.price * 100, // cents
        currency: "usd",
        product: product.productId,
        recurring: {
            interval: payload.paymentType?.toLowerCase() === "monthly" ? "month" : "year",
        },
    });

    if (!price?.id) {
        // Rollback: Delete created product if price creation fails
        await stripe.products.del(product.productId);
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create subscription price");
    }

    // Step 3: Add Stripe productId, priceId, and paymentLink to payload
    payload.paymentLink = product.paymentLink;
    payload.productId = product.productId;
    payload.priceId = price.id;

    // Step 4: Save package in DB
    const result = await Package.create(payload);

    if (!result) {
        // Rollback: Delete Stripe product if DB save fails
        await stripe.products.del(product.productId);
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create Package");
    }

    return result;
};


const updatePackageToDB = async(id: string, payload: IPackage): Promise<IPackage | null>=>{

    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid ID")
    }

    const result = await Package.findByIdAndUpdate(
        {_id: id},
        payload,
        { new: true } 
    );

    if(!result){
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to Update Package")
    }

    return result;
}


const getPackageFromDB = async(paymentType: string): Promise<IPackage[]>=>{
    const query:any = {
        status: "Active"
    }
    if(paymentType){
        query.paymentType = paymentType
    }

    const result = await Package.find(query);
    return result;
}

const getPackageDetailsFromDB = async(id: string): Promise<IPackage | null>=>{
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid ID")
    }
    const result = await Package.findById(id);
    return result;
}

const deletePackageToDB = async(id: string): Promise<IPackage | null>=>{
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid ID")
    }

    const result = await Package.findByIdAndUpdate(
        {_id: id},
        {status: "Delete"},
        {new: true}
    );

    if(!result){
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to deleted Package")
    }

    return result;
}

export const PackageService = {
    createPackageToDB,
    updatePackageToDB,
    getPackageFromDB,
    getPackageDetailsFromDB,
    deletePackageToDB
}