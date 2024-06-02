import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
export const getSingleBackupImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const imageId = req.params.id;

        const image = await db.backupimage.findUnique({
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

        const image = await db.backupimage.delete({ where: { restoreId: imageId } });

        res.status(200).json({ status: image });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}

export const getSingleBackupFileName = async (req: Request, res: Response): Promise<void> => {
    try {
        const imageId = req.params.id;

        const filename = await db.backupfilename.findUnique({
            where: { restoreId: imageId }
        });

        res.status(200).json({ data: filename });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}

export const removeRestoreFileName = async (req: Request, res: Response): Promise<void> => {
    try {
        const imageId = req.params.id;

        const filename = await db.backupfilename.delete({ where: { restoreId: imageId } });

        res.status(200).json({ status: filename });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}

export const getSingleBackupAltName = async (req: Request, res: Response): Promise<void> => {
    try {
        const imageId = req.params.id;

        const altname = await db.backupaltname.findUnique({
            where: { restoreId: imageId }
        });

        res.status(200).json({ data: altname });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}

export const removeRestoreAltName = async (req: Request, res: Response): Promise<void> => {
    try {
        const imageId = req.params.id;

        const altname = await db.backupaltname.delete({ where: { restoreId: imageId } });

        res.status(200).json({ status: altname });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}