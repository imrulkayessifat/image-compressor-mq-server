import amqp from 'amqplib/callback_api';
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

export const getAllImages = async (req: Request, res: Response): Promise<void> => {
    try {
        const images = await db.image.findMany();

        res.status(200).json({ data: images });
    } catch (e) {
        console.log(e);
    }
};

export const getSingleImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const imageId = req.params.id;

        const image = await db.image.findUnique({ where: { id: imageId } });

        res.status(200).json({ data: image });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}

export const getImageStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const imageId = req.params.id;

        const image = await db.image.findUnique({ where: { id: imageId } });

        res.status(200).json({ status: image!.status });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching image status.' });
    }
}

export const compressImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const compressData = req.body;
        const { id, productid, url, storeName } = compressData;

        await db.image.update({
            where: { id: id },
            data: { status: 'ONGOING' },
        });

        amqp.connect('amqp://localhost', (error0: any, connection: { createChannel: (arg0: (error1: any, channel: any) => void) => void; close: () => void; }) => {
            if (error0) {
                throw error0;
            }
            connection.createChannel((error1, channel) => {
                if (error1) {
                    throw error1;
                }

                const queue = 'shopify_to_compressor';
                channel.assertQueue(queue, { durable: false });

                const data = JSON.stringify({ id, productid, url, storeName });
                channel.sendToQueue(queue, Buffer.from(data));
                console.log(" [x] Sent %s", id);

                setTimeout(() => {
                    connection.close();
                }, 500);
            });
        });

        res.json({ status: 'Image compression started' });

    } catch (error) {
        console.error("Error compressing image:", error);
        res.status(500).json({ error: 'An error occurred while compressing image.' });
    }
}

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const compressData = req.body;
        const { id, productid, compressedBuffer } = compressData;

        amqp.connect('amqp://localhost', (error0, connection) => {
            if (error0) {
                throw error0;
            }
            connection.createChannel((error1, channel) => {
                if (error1) {
                    throw error1;
                }

                const queue = 'compressor_to_uploader';
                channel.assertQueue(queue, { durable: false });

                const data = JSON.stringify({ id, productid, compressedBuffer });
                channel.sendToQueue(queue, Buffer.from(data));
                console.log(" [x] Sent %s", id);

                setTimeout(() => {
                    connection.close();
                }, 500);
            });
        });

        res.json({ status: 'Image Uploading started' });

    } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ error: 'An error occurred while uploading image.' });
    }
}

export const removeImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const imageId = req.params.id;

        const image = await db.image.delete({ where: { id: imageId } });

        res.status(200).json({ status: image });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}