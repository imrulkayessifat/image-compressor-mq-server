import { Router } from "express";

import {
    getSingleBackupImage,
    removeRestoreImage
} from "../controllers/backup.controller";

const backupRouter = Router();

backupRouter.get("/:id", getSingleBackupImage)
backupRouter.delete("/:id", removeRestoreImage)


export default backupRouter;