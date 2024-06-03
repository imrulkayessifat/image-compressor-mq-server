import { Router } from "express";

import {
    getBatchCompressImages,
    getBatchRestoreImages,
    batchCompressImages
} from "../controllers/batch.controller";

const batchRouter = Router();

batchRouter.get("/:storename", getBatchCompressImages)
batchRouter.get("/restore/:storename", getBatchRestoreImages)
batchRouter.post("/batch-compress", batchCompressImages)


export default batchRouter;