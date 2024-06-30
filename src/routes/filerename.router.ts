import { Router } from "express";

import {
    getFileRenameSetting,
    updateFileRenameSetting
} from "../controllers/filerename.controller";

import { verifyRequest } from "../middleware/shopify-auth";

const fileRename = Router();

fileRename.get("/:storeName",verifyRequest, getFileRenameSetting)
fileRename.put('/',verifyRequest, updateFileRenameSetting)

export default fileRename;