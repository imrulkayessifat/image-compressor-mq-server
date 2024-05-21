import { Router } from "express";
import {
    tokenDecode
} from "../controllers/jwt.controller";

const jwtRouter = Router();

jwtRouter.post("/", tokenDecode);

export default jwtRouter;