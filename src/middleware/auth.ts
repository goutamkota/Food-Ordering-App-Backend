import { auth } from "express-oauth2-jwt-bearer";
import { decode, JwtPayload } from "jsonwebtoken";
import User from "../models/user";
import { NextFunction, Request, Response } from "express";

declare global {
    namespace Express {
        interface Request {
            userId : string;
            auth0Id : string;
        }
    }
}

export const jwtCheck = auth({
    audience : process.env.AUTH0_AUDIENCE,
    issuerBaseURL : process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg : 'RS256'
});

export const jwtParse = async (req : Request, res : Response, next : NextFunction) => {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) return res.sendStatus(401);
    const token = authorization.split(" ")[1];
    try {
        const decoded = decode(token) as JwtPayload;
        const auth0Id = decoded.sub;
        const user = await User.findOne({ auth0Id });
        if (!user) return res.status(401);
        req.auth0Id = auth0Id as string;
        req.userId = user._id?.toString() as string;
        next();
    } catch (error) {
        return res.sendStatus(401);
    }
}