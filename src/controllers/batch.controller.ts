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
        res.status(400).json({ error: 'something went wrong!' })
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

        console.log("batch compress : ", req.header('Authorization'), req.header('Shop'))

        const data = fetch(`${process.env.MQSERVER}/image/auto-compression`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${req.header('Authorization')}`,
                'Shop': `${req.header('Shop')}`
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
        res.status(400).json({ error: 'something went wrong!' })
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

        console.log("batch restore : ", req.header('Authorization'), req.header('Shop'))
        const data = fetch(`${process.env.MQSERVER}/image/auto-restore`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${req.header('Authorization')}`,
                'Shop': `${req.header('Shop')}`
            },
            body: JSON.stringify({ store_name: req.body.store_name })
        })

        res.status(200).json({ success: 'Batch Restore Started...' });
    } catch (e) {
        res.status(400).json({ error: `something went wrong` });
    }
}