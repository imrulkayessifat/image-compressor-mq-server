import { Router } from "express";
import {
    fileRename,
    restoreFileName,
    altRename,
    restoreAltTag
} from "../controllers/rename.controller";

const renameRouter = Router();

renameRouter.put("/file-rename", fileRename);
renameRouter.put("/restore-file-name", restoreFileName)
renameRouter.put("/alt-rename", altRename)
renameRouter.put("/restore-alt-tag", restoreAltTag)

export default renameRouter;