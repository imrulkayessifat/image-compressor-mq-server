import { Router } from "express";

import {
    getAllImages,
    getImageStatus,
    compressImage,
    uploadImage
} from "../controllers/image.controller";

const imageRouter = Router();

imageRouter.get("/", getAllImages);
imageRouter.get("/image-status/:id", getImageStatus);
imageRouter.post("/compress-image", compressImage)
imageRouter.post("/upload-image", uploadImage)

export default imageRouter;