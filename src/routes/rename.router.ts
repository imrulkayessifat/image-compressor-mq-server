import { Router } from "express";
import {
    fileRename,
    autoFileRename,
    restoreFileName,
    altRename,
    autoAltRename,
    restoreAltTag
} from "../controllers/rename.controller";

import { verifyRequest } from "../middleware/shopify-auth";

const renameRouter = Router();

renameRouter.put("/file-rename", verifyRequest, fileRename);
renameRouter.put("/auto-file-rename", verifyRequest, autoFileRename);
renameRouter.put("/restore-file-name", verifyRequest, restoreFileName)
renameRouter.put("/alt-rename", verifyRequest, altRename)
renameRouter.put("/auto-alt-rename", verifyRequest, autoAltRename)
renameRouter.put("/restore-alt-tag", verifyRequest, restoreAltTag)

export default renameRouter;