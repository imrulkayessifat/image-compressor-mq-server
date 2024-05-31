import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();


export const getFileRenameSetting = async (req: Request, res: Response): Promise<void> => {
    try {
        const storeName = req.params.storeName;

        const filerename = await db.filerename.findUnique({
            where: {
                id: '1',
                storename: storeName
            }
        });

        res.status(200).json({ filerename });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}

export const updateFileRenameSetting = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;

        const filerename = await db.filerename.update({
            where:{
                id:'1',
                storename:data.storename
            },
            data:{
                ...data
            }
        })

        console.log(filerename)

        res.status(200).json({ success: 'file setting successfully updated' });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}