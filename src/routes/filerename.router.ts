import { Router } from "express";

import {
    getFileRenameSetting,
    updateFileRenameSetting
} from "../controllers/filerename.controller";

const fileRename = Router();

fileRename.get("/:storeName", getFileRenameSetting)
fileRename.put('/', updateFileRenameSetting)

export default fileRename;