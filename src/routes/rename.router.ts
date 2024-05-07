import { Router } from "express";
import {
    fileRename
} from "../controllers/rename.controller";

const renameRouter = Router();

renameRouter.put("/file-rename", fileRename);

export default renameRouter;