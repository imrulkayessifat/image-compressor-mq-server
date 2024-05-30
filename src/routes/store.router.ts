import { Router } from "express";
import {
    getSingleStoreData,
    getStoreToken,
    updateStoreAutoCompression,
    updateStoreAutoFileRename,
    updateStoreAutoAltRename,
    updateStoreCompressType,
    updateStoreCustomCompressType
} from "../controllers/store.controller";

const storeRouter = Router();

storeRouter.post("/", getSingleStoreData);
storeRouter.post("/token", getStoreToken)
storeRouter.put('/', updateStoreAutoCompression)
storeRouter.put('/auto-file-rename',updateStoreAutoFileRename)
storeRouter.put('/auto-alt-rename',updateStoreAutoAltRename)
storeRouter.put('/compression-type', updateStoreCompressType)
storeRouter.put('/custom-compression-type',updateStoreCustomCompressType)

export default storeRouter;