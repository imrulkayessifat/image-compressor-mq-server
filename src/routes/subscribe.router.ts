import { Router } from "express";
import {
    subscribeData,
    getSingleChargeData
} from "../controllers/subscribe.controller";

const subscribeRouter = Router();

subscribeRouter.post("/charge", getSingleChargeData)
subscribeRouter.post("/", subscribeData);

export default subscribeRouter;