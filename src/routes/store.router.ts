import { Router } from "express";
import {
    getSingleStoreData,
    getAllStoreData,
    getStoreToken,
    updateStoreAutoCompression,
    updateStoreAutoFileRename,
    updateStoreAutoAltRename,
    updateStoreCompressType,
    updateStoreCustomCompressType
} from "../controllers/store.controller";

import { verifyRequest } from "../middleware/shopify-auth";

const storeRouter = Router();

storeRouter.post("/", getSingleStoreData);
storeRouter.get("/", getAllStoreData)
storeRouter.post("/token", getStoreToken)
storeRouter.put('/',verifyRequest, updateStoreAutoCompression)
storeRouter.put('/auto-file-rename',verifyRequest, updateStoreAutoFileRename)
storeRouter.put('/auto-alt-rename',verifyRequest, updateStoreAutoAltRename)
storeRouter.put('/compression-type', updateStoreCompressType)
storeRouter.put('/custom-compression-type', updateStoreCustomCompressType)

export default storeRouter;