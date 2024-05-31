import { Router } from "express";

import {
    getAltRenameSetting,
    updateAltRenameSetting
} from "../controllers/altrename.controller";

const altRename = Router();

altRename.get("/:storeName", getAltRenameSetting)
altRename.put('/', updateAltRenameSetting)

export default altRename;