import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import { jwtHelper } from '../../helpers/jwtHelper';
import ApiError from '../../errors/ApiErrors';

const auth = (...roles: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("Auth middleware start");

        const tokenWithBearer = req.headers.authorization;
        if (!tokenWithBearer) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
        }

        // যদি Bearer থাকে তাহলে split করে নাও, না থাকলে সরাসরি টোকেন নাও
        const token = tokenWithBearer.startsWith('Bearer ')
            ? tokenWithBearer.split(' ')[1]
            : tokenWithBearer;

        // verify token
        const verifyUser = jwtHelper.verifyToken(
            token,
            config.jwt.jwt_secret as Secret
        );

        // set user
        req.user = verifyUser;

        // guard user role
        if (roles.length && !roles.includes(verifyUser.role)) {
            throw new ApiError(StatusCodes.FORBIDDEN, "You don't have permission to access this api");
        }

        console.log("Auth middleware end");
        next();

    } catch (error) {
        next(error);
    }
};

export default auth;