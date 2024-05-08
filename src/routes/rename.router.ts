import { Router } from "express";
import {
    fileRename,
    altRename
} from "../controllers/rename.controller";

const renameRouter = Router();

renameRouter.put("/file-rename", fileRename);
renameRouter.put("/alt-rename", altRename)

export default renameRouter;