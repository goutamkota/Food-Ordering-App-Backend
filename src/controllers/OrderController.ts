import Stripe from "stripe";
import express from "express";
import Restaurant, { MenuItemType } from "../models/restaurant";

const STRIPE = new Stripe(process.env.STRIPE_API_KEY as string);
const FRONTEND_URL = process.env.FRONTEND_URL as string;

type CheckoutSessionRequest = {
    cartItems: {
        menuItemId: string;
        name: string;
        quantity: string;
    }[];
    deliveryDetails: {
        email: string;
        name: string;
        addressLine1: string;
        city: string;
    };
    restaurantId: string;
};

const createCheckoutSession = async (req : express.Request, res : express.Response) => {
    try {
        const checkoutSessionRequest : CheckoutSessionRequest = req.body;
        const restaurant = await Restaurant.findById(checkoutSessionRequest.restaurantId);
        if (!restaurant) return res.status(404).json({ message : "Restaurant not found." });
        const lineItems = createLineItems(checkoutSessionRequest, restaurant.menuItems);
        const session = await createSession(lineItems, "TEST_ORDER_ID", restaurant.deliveryPrice, restaurant._id.toString());
        if (!session.url) return res.status(500).json({ message : "Error creating stripe session." });
        res.json({url: session.url});
    } catch (error : any) {
        console.log(error, "stripe checkout");
        res.status(500).json({ message : error.message || error.raw.message });
    }
}

const createLineItems = (checkoutSessionRequest : CheckoutSessionRequest, menuItems : MenuItemType[]) => {
    return checkoutSessionRequest.cartItems.map((cartItem) => {
        const menuItem = menuItems.find(
            (menuItem) => menuItem._id.toString() === cartItem.menuItemId.toString()
        );
        if (!menuItem) throw new Error(`Menu item not found: ${cartItem.menuItemId}.`);
        const line_item : Stripe.Checkout.SessionCreateParams.LineItem = {
            price_data : {
                currency : "inr",
                unit_amount : menuItem.price * 100,
                product_data : {
                    name : menuItem.name,
                }
            },
            quantity : parseInt(cartItem.quantity),
        };
        return line_item;
    });
}

const createSession = async (lineItems : Stripe.Checkout.SessionCreateParams.LineItem[], orderId : string, deliveryPrice : number, restaurantId : string) => {
    return await STRIPE.checkout.sessions.create({
        line_items : lineItems,
        shipping_options : [
            {
                shipping_rate_data : {
                    display_name : "Delivery",
                    type : "fixed_amount",
                    fixed_amount : {
                        amount : deliveryPrice * 100,
                        currency : "inr"
                    }
                }
            },
        ],
        mode : "payment",
        metadata : {
            orderId,
            restaurantId,
        },
        success_url : `${FRONTEND_URL}/order-status?success=true`,
        cancel_url : `${FRONTEND_URL}/detail/${restaurantId}?cancelled=true`,
    });
}

export default { createCheckoutSession };