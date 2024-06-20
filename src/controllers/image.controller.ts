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

export const getImageThroughSSE = async (req: Request, res: Response): Promise<void> => {
    try {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin","*")
        const images = await db.image.findMany();

        res.write(`data: ${JSON.stringify(images)}\n\n`);
        res.end()
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
        console.log(storeName)
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
                console.log(" [x] Sent to shopify_to_compressor %s", id);

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

export const restoreImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const compressData = req.body;
        const { id, productid, store_name } = compressData;

        const backupData = await db.backupimage.findFirst({
            where: {
                restoreId: id
            }
        })

        const url = backupData.url

        await db.store.update({
            where: {
                name: store_name
            },
            data: {
                autoCompression: false
            }
        })

        await db.image.update({
            where: { id: id },
            data: { status: 'RESTORING' },
        });

        amqp.connect('amqp://localhost', (error0: any, connection: { createChannel: (arg0: (error1: any, channel: any) => void) => void; close: () => void; }) => {
            if (error0) {
                throw error0;
            }
            connection.createChannel((error1, channel) => {
                if (error1) {
                    throw error1;
                }

                const queue = 'restore_image';
                channel.assertQueue(queue, { durable: false });

                const data = JSON.stringify({ id, productid, url, store_name });
                channel.sendToQueue(queue, Buffer.from(data));
                console.log(" [x] Sent %s", id);

                setTimeout(() => {
                    connection.close();
                }, 500);
            });
        });

        res.json({ status: 'Image Restoring started' });

    } catch (error) {
        console.error("Error Restoring image:", error);
        res.status(500).json({ error: 'An error occurred while Restoring image.' });
    }
}

export const autoCompression = async (req: Request, res: Response): Promise<void> => {
    try {
        const { store_name } = req.body;

        const allProducts = await db.product.findMany({
            where: {
                storename: store_name
            }
        })

        for (const product of allProducts) {
            const allImages = await db.image.findMany({
                where: {
                    status: 'NOT_COMPRESSED',
                    productId: product.id
                }
            })

            for (const image of allImages) {
                const { id, productId, url } = image;
                await db.image.update({
                    where: { id: image.id },
                    data: { status: 'ONGOING' },
                });

                amqp.connect('amqp://localhost', async (error0: any, connection: { createChannel: (arg0: (error1: any, channel: any) => void) => void; close: () => void; }) => {
                    if (error0) {
                        throw error0;
                    }
                    connection.createChannel((error1, channel) => {
                        if (error1) {
                            throw error1;
                        }

                        const queue = 'auto_compression';
                        channel.assertQueue(queue, { durable: false });

                        const data = JSON.stringify({ id, productId, url, store_name });
                        channel.sendToQueue(queue, Buffer.from(data));
                        console.log(" [x] Sent %s", id);

                        setTimeout(() => {
                            connection.close();
                        }, 500);
                    });
                });
            }
        }

        res.json({ status: 'Auto Image compression started' });
    } catch (error) {
        console.error("Error compressing image:", error);
        res.status(500).json({ error: 'An error occurred while compressing image.' });
    }
}

export const autoRestore = async (req: Request, res: Response): Promise<void> => {
    try {
        const { store_name } = req.body;

        const allProducts = await db.product.findMany({
            where: {
                storename: store_name
            }
        })

        for (const product of allProducts) {
            const allImages = await db.image.findMany({
                where: {
                    status: 'COMPRESSED',
                    productId: product.id
                }
            })

            for (const image of allImages) {
                const { id, productId } = image;

                const backupData = await db.backupimage.findFirst({
                    where: {
                        restoreId: id
                    }
                })

                const url = backupData.url

                await db.image.update({
                    where: { id: image.id },
                    data: { status: 'RESTORING' },
                });

                amqp.connect('amqp://localhost', async (error0: any, connection: { createChannel: (arg0: (error1: any, channel: any) => void) => void; close: () => void; }) => {
                    if (error0) {
                        throw error0;
                    }
                    connection.createChannel((error1, channel) => {
                        if (error1) {
                            throw error1;
                        }

                        const queue = 'auto_restore';
                        channel.assertQueue(queue, { durable: false });

                        const data = JSON.stringify({ id, productId, url, store_name });
                        channel.sendToQueue(queue, Buffer.from(data));
                        console.log(" [x] Restore Sent %s", id);

                        setTimeout(() => {
                            connection.close();
                        }, 500);
                    });
                });
            }
        }

        res.json({ status: 'Auto Image Restoring started' });
    } catch (error) {
        console.error("Error restoring image:", error);
        res.status(500).json({ error: 'An error occurred while restoring image.' });
    }
}

export const autoFileRename = async (req: Request, res: Response): Promise<void> => {
    try {
        const { store_name } = req.body;
        console.log("image controller : ", store_name)
        const allProducts = await db.product.findMany({
            where: {
                storename: store_name
            }
        })

        for (const product of allProducts) {
            const allImages = await db.image.findMany({
                where: {
                    fileRename: false,
                    productId: product.id
                }
            })

            for (const image of allImages) {
                const { id } = image;

                amqp.connect('amqp://localhost', async (error0: any, connection: { createChannel: (arg0: (error1: any, channel: any) => void) => void; close: () => void; }) => {
                    if (error0) {
                        throw error0;
                    }
                    connection.createChannel((error1, channel) => {
                        if (error1) {
                            throw error1;
                        }

                        const queue = 'auto_file_rename';
                        channel.assertQueue(queue, { durable: false });

                        const data = JSON.stringify({ id, store_name });
                        channel.sendToQueue(queue, Buffer.from(data));
                        console.log(" [x] Auto File Rename Sent %s", id);

                        setTimeout(() => {
                            connection.close();
                        }, 500);
                    });
                });
            }
        }

        res.json({ status: 'Auto File Rename started' });
    } catch (error) {
        console.error("Error File Rename:", error);
        res.status(500).json({ error: 'An error occurred while File Rename.' });
    }
}

export const autoAltRename = async (req: Request, res: Response): Promise<void> => {
    try {
        const { store_name } = req.body;
        const allProducts = await db.product.findMany({
            where: {
                storename: store_name
            }
        })

        for (const product of allProducts) {
            const allImages = await db.image.findMany({
                where: {
                    altRename: false,
                    productId: product.id
                }
            })

            for (const image of allImages) {
                const { id } = image;

                amqp.connect('amqp://localhost', async (error0: any, connection: { createChannel: (arg0: (error1: any, channel: any) => void) => void; close: () => void; }) => {
                    if (error0) {
                        throw error0;
                    }
                    connection.createChannel((error1, channel) => {
                        if (error1) {
                            throw error1;
                        }

                        const queue = 'auto_alt_rename';
                        channel.assertQueue(queue, { durable: false });

                        const data = JSON.stringify({ id, store_name });
                        channel.sendToQueue(queue, Buffer.from(data));
                        console.log(" [x] Auto Alt Rename Sent %s", id);

                        setTimeout(() => {
                            connection.close();
                        }, 500);
                    });
                });
            }
        }

        res.json({ status: 'Auto Alt Rename started' });
    } catch (error) {
        console.error("Error Alt Rename:", error);
        res.status(500).json({ error: 'An error occurred while Alt Rename.' });
    }
}

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const compressData = req.body;
        const { id, productid, compressedBuffer, storeName } = compressData;

        console.log("upload Image", storeName)

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

                const data = JSON.stringify({ id, productid, compressedBuffer, storeName });
                console.log('length', Buffer.byteLength(data, 'utf8'))
                channel.sendToQueue(queue, Buffer.from(data));
                console.log(" [x] Sent to compressor_to_uploader %s", id);

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

export const restoreUploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const compressData = req.body;
        const { id, productid, url, storeName } = compressData;

        amqp.connect('amqp://localhost', (error0, connection) => {
            if (error0) {
                throw error0;
            }
            connection.createChannel((error1, channel) => {
                if (error1) {
                    throw error1;
                }

                const queue = 'restore_to_uploader';
                channel.assertQueue(queue, { durable: false });

                const data = JSON.stringify({ id, productid, url, storeName });
                channel.sendToQueue(queue, Buffer.from(data));
                console.log(" [x] Restore_Uploader Sent %s", id);

                setTimeout(() => {
                    connection.close();
                }, 500);
            });
        });

        res.json({ status: 'Image Restoring Uploading started' });

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