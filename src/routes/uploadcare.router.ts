import { Router } from "express";

import {
    getFileInfo
} from "../controllers/uploadcare.controller";

const uploadcareRouter = Router();

uploadcareRouter.get("/:id", getFileInfo);

export default uploadcareRouter;