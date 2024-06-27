import { Router } from "express";
import { Request, Response, NextFunction } from "express";

import {
    getAllImages,
    getImageThroughSSE,
    getSingleImage,
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

const imageRouter = Router();

const verifyRequest = async (req: Request, res: Response, next: NextFunction) => {
    const shopifyAccessToken = req.header('Authorization')

    if (!shopifyAccessToken) {
        res.status(401).json({ error: 'No token,authorization denied!' })
    }

    console.log("shopify access token middleware : ", shopifyAccessToken);

    next()
}

imageRouter.get("/:storeName", verifyRequest, getAllImages);
imageRouter.get("/sse", getImageThroughSSE);
imageRouter.get("/:id", getSingleImage)
imageRouter.get("/manual/:uuid", getSingleImageManual)
imageRouter.get("/image-status/:id", getImageStatus);
imageRouter.post("/compress-image", compressImage);
imageRouter.post("/restore-image", restoreImage)
imageRouter.post("/auto-compression", autoCompression)
imageRouter.post("/auto-restore", autoRestore)
imageRouter.post("/auto-file-rename", autoFileRename)
imageRouter.post("/auto-alt-rename", autoAltRename)
imageRouter.post("/upload-image", uploadImage)
imageRouter.post("/restore-upload", restoreUploadImage)
imageRouter.delete("/:id", removeImage)

export default imageRouter;