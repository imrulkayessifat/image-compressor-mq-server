import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

import * as jwt from 'jsonwebtoken'

const db = new PrismaClient();

export const getAccessToken = async (req: Request, res: Response): Promise<void> => {

    try {
        const storeName = req.params.storeName;

        const response = await db.session.findFirst({
            where:{
                shop:storeName
            }
        })

        res.status(200).json({ access_token: response.accessToken });
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }


}