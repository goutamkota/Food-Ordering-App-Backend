import Stripe from "stripe";
import express from "express";
import Restaurant, { MenuItemType } from "../models/restaurant";
import Order from "../models/order";

const STRIPE = new Stripe(process.env.STRIPE_API_KEY as string);
const FRONTEND_URL = process.env.FRONTEND_URL as string;
const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

type CheckoutSessionRequest = {
    cartItems : {
        menuItemId : string;
        name : string;
        quantity : string;
    }[];
    deliveryDetails : {
        email : string;
        name : string;
        addressLine1 : string;
        city : string;
    };
    restaurantId : string;
};

const createCheckoutSession = async (req : express.Request, res : express.Response) => {
    try {
        const checkoutSessionRequest : CheckoutSessionRequest = req.body;
        const restaurant = await Restaurant.findById(checkoutSessionRequest.restaurantId);
        if (!restaurant) return res.status(404).json({ message : "Restaurant not found." });
        const newOrder = new Order({
            restaurant : restaurant,
            user : req.userId,
            status : "placed",
            deliveryDetails : checkoutSessionRequest.deliveryDetails,
            cartItems : checkoutSessionRequest.cartItems,
            createdAt : new Date(),
        })
        const lineItems = createLineItems(checkoutSessionRequest, restaurant.menuItems);
        const session = await createSession(
            lineItems,
            newOrder._id.toString(),
            restaurant.deliveryPrice,
            restaurant._id.toString()
        );
        if (!session.url) return res.status(500).json({ message : "Error creating stripe session." });
        await newOrder.save();
        res.json({ url : session.url });
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

const stripeWebhookHandler = async (req : express.Request, res : express.Response) => {
    let event;
    try {
        const sig = req.headers["stripe-signature"];
        event = STRIPE.webhooks.constructEvent(
            req.body,
            sig as string,
            STRIPE_ENDPOINT_SECRET
        )
    } catch (error : any) {
        console.log(error);
        return res.status(400).json(`Webhook error: ${error.message}`);
    }
    if (event.type === "checkout.session.completed") {
        const order = await Order.findById(event.data.object.metadata?.orderId);
        if (!order) return res.status(400).json({ message : "Order not found" });
        order.totalAmount = event.data.object.amount_total;
        order.status = "paid";

        await order.save();
    }
    res.status(200).send();
}

export default { createCheckoutSession, stripeWebhookHandler };