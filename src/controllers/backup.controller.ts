import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
export const getSingleBackupImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const imageId = req.params.id;

        const image = await db.backup.findUnique({
            where: { restoreId: imageId }
        });

        res.status(200).json({ data: image });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}

export const removeRestoreImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const imageId = req.params.id;

        const image = await db.backup.delete({ where: { restoreId: imageId } });

        res.status(200).json({ status: image });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}