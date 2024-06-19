import { Router } from "express";
import {
    subscribeData,
    confirmation,
    remove
} from "../controllers/subscribe.controller";

const subscribeRouter = Router();

subscribeRouter.post("/", subscribeData);
subscribeRouter.get("/confirmation", confirmation)
subscribeRouter.delete("/remove", remove)

export default subscribeRouter;