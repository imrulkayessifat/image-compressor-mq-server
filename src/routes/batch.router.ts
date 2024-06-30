import { Router } from "express";

import {
    getBatchCompressImages,
    getBatchRestoreImages,
    batchCompressImages,
    batchRestoreImages
} from "../controllers/batch.controller";

import { verifyRequest } from "../middleware/shopify-auth";

const batchRouter = Router();

batchRouter.get("/:storename",verifyRequest, getBatchCompressImages)
batchRouter.get("/restore/:storename",verifyRequest, getBatchRestoreImages)
batchRouter.post("/batch-compress", batchCompressImages)
batchRouter.post("/batch-restore", batchRestoreImages)


export default batchRouter;