import { Router } from "express";
import {
    subscribeData,
    confirmation,
    remove
} from "../controllers/subscribe.controller";

import { verifyRequest } from "../middleware/shopify-auth";

const subscribeRouter = Router();

subscribeRouter.post("/",verifyRequest, subscribeData);
subscribeRouter.get("/confirmation", confirmation)
subscribeRouter.delete("/remove", remove)

export default subscribeRouter;