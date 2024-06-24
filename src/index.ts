import express, { Express, Request } from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import MyUserRoute from "./routes/MyUserRoute";
import MyRestaurantRoute from "./routes/MyRestaurantRoute";
import RestaurantRoute from "./routes/RestaurantRoute";
import { v2 as cloudinary } from "cloudinary"
import OrderRoute from "./routes/OrderRoute";

mongoose
    .connect(process.env.MONGODB_CONNECTION_STRING as string)
    .then(() => console.log("Connected MongoDB!"))
    .catch((error : Error) => console.log(error))

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET,
})

const corsOptions = {
    origin : '*',
    methods : 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue : false,
    optionsSuccessStatus : 204
};

const app : Express = express();
app.use(express.json());
app.use(cors(corsOptions));

app.get("/health", async (req : Request, res : express.Response) => {
    res.send({ message : "Health Status is OK" });
})

// Redirect to route
app.use('/api/my/user', MyUserRoute)
app.use('/api/my/restaurant', MyRestaurantRoute)
app.use('/api/restaurant', RestaurantRoute)
app.use('/api/order', OrderRoute)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}.`));