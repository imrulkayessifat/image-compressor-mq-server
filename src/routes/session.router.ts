import { Router } from "express";

import {
    getAccessToken,
} from "../controllers/session.controller";

const sessionRouter = Router();

sessionRouter.get("/:storeName", getAccessToken)

export default sessionRouter;