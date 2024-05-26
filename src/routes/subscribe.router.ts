import { Router } from "express";
import {
    subscribeData,
    confirmation
} from "../controllers/subscribe.controller";

const subscribeRouter = Router();

subscribeRouter.post("/", subscribeData);
subscribeRouter.get("/confirmation",confirmation)

export default subscribeRouter;