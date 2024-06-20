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

export const validateMyRestaurantRequest = [
    body("restaurantName").isString().notEmpty().withMessage("Restaurant Name is required"),
    body("city").isString().notEmpty().withMessage("City number must be required"),
    body("country").isString().notEmpty().withMessage("Country number must be required"),
    body("deliveryPrice").isFloat({min: 0}).withMessage("DeliveryPrice must be number"),
    body("estimatedDeliveryTime").isInt({min:0}).withMessage("Estimated DeliveryTime must be number"),
    body("cuisines").isArray().withMessage("Cuisine is an array").not().isEmpty().withMessage("Cuisine array must not be empty"),
    body("menuItems").isArray().withMessage("Menu Items must be an array"),
    body("menuItems.*.name").notEmpty().withMessage("Menu Item Name is required"),
    body("menuItems.*.price").isFloat({min: 0}).withMessage("Menu Item Price is required and must be number"),
    handleValidationErrors,
]
