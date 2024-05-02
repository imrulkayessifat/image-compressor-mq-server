import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const db = new PrismaClient();

export const getSingleStoreData = async (req: Request, res: Response): Promise<void> => {
    const response = await db.store.findFirst({
        where:{
            name:req.body.storeName
        }
    })
    res.status(200).json({ data: response });

}