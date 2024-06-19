import express, { Express, Request } from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import myUserRoute from "./routes/MyUserRoute";

mongoose
    .connect(process.env.MONGODB_CONNECTION_STRING as string)
    .then(() => console.log("Connected MongoDB!"))
    .catch((error : Error) => console.log(error))

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

app.use('/api/my/user', myUserRoute)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}.`));