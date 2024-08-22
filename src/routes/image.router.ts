import { Router } from "express";

import {
    getAllImages,
    getImageThroughSSE,
    getSingleImage,
    caculateImageSize,
    getSingleImageManual,
    getImageStatus,
    compressImage,
    restoreImage,
    autoCompression,
    autoRestore,
    autoFileRename,
    autoAltRename,
    uploadImage,
    restoreUploadImage,
    removeImage
} from "../controllers/image.controller";
import { verifyRequest } from "../middleware/shopify-auth";

const imageRouter = Router();

imageRouter.get("/:storeName", verifyRequest, getAllImages);
imageRouter.patch("/:uid", caculateImageSize)
imageRouter.get("/sse", getImageThroughSSE);
imageRouter.get("/:id", getSingleImage)
imageRouter.get("/manual/:uuid", getSingleImageManual)
imageRouter.get("/image-status/:id", getImageStatus);
imageRouter.post("/compress-image", verifyRequest, compressImage);
imageRouter.post("/restore-image", verifyRequest, restoreImage)
imageRouter.post("/auto-compression", verifyRequest, autoCompression)
imageRouter.post("/auto-restore", verifyRequest, autoRestore)
imageRouter.post("/auto-file-rename", autoFileRename)
imageRouter.post("/auto-alt-rename", autoAltRename)
imageRouter.post("/upload-image", uploadImage)
imageRouter.post("/restore-upload", restoreUploadImage)
imageRouter.delete("/:id", removeImage)

export default imageRouter;