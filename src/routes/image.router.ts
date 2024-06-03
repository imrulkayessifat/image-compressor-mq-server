import { Router } from "express";

import {
    getAllImages,
    getSingleImage,
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

imageRouter.get("/", getAllImages);
imageRouter.get("/:id", getSingleImage)
imageRouter.get("/image-status/:id", getImageStatus);
imageRouter.post("/compress-image", compressImage);
imageRouter.post("/restore-image", restoreImage)
imageRouter.post("/auto-compression", autoCompression)
imageRouter.post("/auto-restore",autoRestore)
imageRouter.post("/auto-file-rename",autoFileRename)
imageRouter.post("/auto-alt-rename",autoAltRename)
imageRouter.post("/upload-image", uploadImage)
imageRouter.post("/restore-upload", restoreUploadImage)
imageRouter.delete("/:id", removeImage)

export default imageRouter;