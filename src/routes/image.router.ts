import { Router } from "express";

import {
    getAllImages,
    getSingleImage,
    getImageStatus,
    compressImage,
    uploadImage,
    removeImage
} from "../controllers/image.controller";

const imageRouter = Router();

imageRouter.get("/", getAllImages);
imageRouter.get("/:id",getSingleImage)
imageRouter.get("/image-status/:id", getImageStatus);
imageRouter.post("/compress-image", compressImage)
imageRouter.post("/upload-image", uploadImage)
imageRouter.delete("/:id",removeImage)

export default imageRouter;