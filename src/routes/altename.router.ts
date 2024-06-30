import { Router } from "express";

import {
    getAltRenameSetting,
    updateAltRenameSetting
} from "../controllers/altrename.controller";

import { verifyRequest } from "../middleware/shopify-auth";

const altRename = Router();

altRename.get("/:storeName", verifyRequest, getAltRenameSetting)
altRename.put('/', verifyRequest, updateAltRenameSetting)

export default altRename;