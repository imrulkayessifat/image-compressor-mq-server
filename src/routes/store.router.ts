import { Router } from "express";
import {
    getSingleStoreData,
    getStoreToken,
    updateStoreAutoCompression
} from "../controllers/store.controller";

const storeRouter = Router();

storeRouter.post("/", getSingleStoreData);
storeRouter.post("/token", getStoreToken)
storeRouter.put('/', updateStoreAutoCompression)

export default storeRouter;