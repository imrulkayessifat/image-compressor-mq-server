import { Router } from "express";

import {
    getAllImages,
    getImageStatus,
    compressImage,
    uploadImage,
    removeImage
} from "../controllers/image.controller";

const imageRouter = Router();

imageRouter.get("/", getAllImages);
imageRouter.get("/image-status/:id", getImageStatus);
imageRouter.post("/compress-image", compressImage)
imageRouter.post("/upload-image", uploadImage)
imageRouter.delete("/:id",removeImage)

export default imageRouter;