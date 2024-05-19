import { Router } from "express";

import {
    getAllImages,
    getSingleImage,
    getImageStatus,
    compressImage,
    restoreImage,
    autoCompression,
    uploadImage,
    restoreUploadImage,
    removeImage
} from "../controllers/image.controller";

const imageRouter = Router();

imageRouter.get("/", getAllImages);
imageRouter.get("/:id", getSingleImage)
imageRouter.get("/image-status/:id", getImageStatus);
imageRouter.post("/compress-image", compressImage);
imageRouter.post("/restore-image", restoreImage)
imageRouter.post("/auto-compression", autoCompression)
imageRouter.post("/upload-image", uploadImage)
imageRouter.post("/restore-upload", restoreUploadImage)
imageRouter.delete("/:id", removeImage)

export default imageRouter;