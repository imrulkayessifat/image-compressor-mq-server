import { Router } from "express";
import {
    getSingleStoreData
} from "../controllers/store.controller";

const storeRouter = Router();

storeRouter.post("/", getSingleStoreData);

export default storeRouter;