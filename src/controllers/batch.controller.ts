import amqp from 'amqplib/callback_api';
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

export const getBatchCompressImages = async (req: Request, res: Response): Promise<void> => {
    try {
        let length = 0;
        const storename = req.params.storename;

        const products = await db.product.findMany({
            where: {
                storename: storename
            }
        });

        for (const product of products) {
            const allImages = await db.image.findMany({
                where: {
                    status: 'NOT_COMPRESSED',
                    productId: product.id
                }
            })
            length = length + allImages.length
        }
        res.status(200).json({ batch_compress_images_length: length });
    } catch (e) {
        console.log(e);
    }
};

export const batchCompressImages = async (req: Request, res: Response): Promise<void> => {
    try {

        const store = await db.store.update({
            where: {
                name: req.body.store_name
            },
            data: {
                batchCompress: true
            }
        })

        const data = await fetch('http://localhost:3001/image/auto-compression', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ store_name: req.body.store_name })
        })

        res.status(200).json({ success: 'Batch Compress Started...' });
    } catch (e) {
        res.status(400).json({ error: `something went wrong` });
    }
}

export const getBatchRestoreImages = async (req: Request, res: Response): Promise<void> => {
    try {
        let length = 0;
        const storename = req.params.storename;
        const products = await db.product.findMany({
            where: {
                storename: storename
            }
        });

        for (const product of products) {
            const allImages = await db.image.findMany({
                where: {
                    status: 'COMPRESSED',
                    productId: product.id
                }
            })
            length = length + allImages.length
        }
        res.status(200).json({ batch_restore_images_length: length });
    } catch (e) {
        console.log(e);
    }
};

export const batchRestoreImages = async (req: Request, res: Response): Promise<void> => {
    try {

        const store = await db.store.update({
            where: {
                name: req.body.store_name
            },
            data: {
                batchRestore: true
            }
        })

        const data = await fetch('http://localhost:3001/image/auto-restore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ store_name: req.body.store_name })
        })

        res.status(200).json({ success: 'Batch Restore Started...' });
    } catch (e) {
        res.status(400).json({ error: `something went wrong` });
    }
}