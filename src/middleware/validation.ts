import { body, validationResult } from 'express-validator';
import express, { NextFunction } from "express";

export const handleValidationErrors = async (req : express.Request, res : express.Response, next : NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors : errors.array() });
    }
    next();
}

export const validateMyUserRequest = [
    body("name").isString().notEmpty().withMessage("Name must be string"),
    body("address").isString().notEmpty().withMessage("Address must be string"),
    body("country").isString().notEmpty().withMessage("Country number must be string"),
    body("city").isString().notEmpty().withMessage("City number must be string"),
    handleValidationErrors,
]

