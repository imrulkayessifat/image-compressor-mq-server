import { Router } from "express";

import {
    getSingleBackupImage,
    removeRestoreImage,
    getSingleBackupFileName,
    removeRestoreFileName,
    getSingleBackupAltName,
    removeRestoreAltName
} from "../controllers/backup.controller";

const backupRouter = Router();

backupRouter.get("/:id", getSingleBackupImage)
backupRouter.get("/filename/:id", getSingleBackupFileName)
backupRouter.get("/altname/:id", getSingleBackupAltName)
backupRouter.delete("/:id", removeRestoreImage)
backupRouter.delete("/filename/:id", removeRestoreFileName)
backupRouter.delete("/altname/:id", removeRestoreAltName)


export default backupRouter;