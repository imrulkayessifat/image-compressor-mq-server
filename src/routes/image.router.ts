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
    const shop = req.header('shop')

    if (!shop || !shopifyAccessToken) {
        return res.status(401).send('Unauthorized');
    }

    console.log("shopify access token middleware :", shop, shopifyAccessToken)

    try {
        const response = await fetch(`https://${shop}/admin/api/2024-04/shop.json`, {
            headers: {
                'X-Shopify-Access-Token': shopifyAccessToken
            }
        });
        if (response.status === 200) {
            return next();
        } else {
            const errorDetails = await response.text();
            console.log("error details : ", errorDetails)
            return res.status(401).send('Unauthorized');
        }
    } catch (error) {
        console.log("ppppp")
        return res.status(401).send('Unauthorized');
    }
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