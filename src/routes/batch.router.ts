import { Router } from "express";

import {
    getBatchCompressImages,
    getBatchRestoreImages,
    batchCompressImages,
    batchRestoreImages
} from "../controllers/batch.controller";

const batchRouter = Router();

batchRouter.get("/:storename", getBatchCompressImages)
batchRouter.get("/restore/:storename", getBatchRestoreImages)
batchRouter.post("/batch-compress", batchCompressImages)
batchRouter.post("/batch-restore", batchRestoreImages)


export default batchRouter;