import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const db = new PrismaClient();

export const getSingleStoreData = async (req: Request, res: Response): Promise<void> => {

    const response = await db.store.findFirst({
        where: {
            name: req.body.storeName
        }
    })
    
    res.status(200).json({ data: response });

}

export const updateStoreAutoCompression = async (req: Request, res: Response): Promise<void> => {

    const response = await db.store.update({
        where: {
            name: req.body.store_name
        },
        data: {
            autoCompression: req.body.auto_compression
        }
    })

    if (response.autoCompression === true) {
        await fetch('http://localhost:3001/image/auto-compression', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ store_name: req.body.store_name })
        })
    }


}