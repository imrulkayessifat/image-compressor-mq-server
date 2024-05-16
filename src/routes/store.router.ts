import { Router } from "express";
import {
    getSingleStoreData,
    updateStoreAutoCompression
} from "../controllers/store.controller";

const storeRouter = Router();

storeRouter.post("/", getSingleStoreData);
storeRouter.put('/', updateStoreAutoCompression)

export default storeRouter;