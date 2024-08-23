import amqp from 'amqplib/callback_api';
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Image } from '@prisma/client';
import { Extenstion } from '@prisma/client';

import Bottleneck from "bottleneck";

const limiter = new Bottleneck({
    minTime: 200, // 500ms delay between requests
    // maxConcurrent: 1 // Ensures only one request is processed at a time
});

const limitedFetch: (url: string, options?: RequestInit) => Promise<globalThis.Response> = limiter.wrap(
    (url: string, options?: RequestInit): Promise<globalThis.Response> => {
        return fetch(url, options);
    }
);
import { io } from '../index';

const db = new PrismaClient();

export const getAllImages = async (req: Request, res: Response): Promise<void> => {
    try {

        const storeName = req.params.storeName;

        const images = await db.image.findMany({
            where: {
                storename: storeName
            },
            orderBy: {
                uid: 'asc'
            }
        })


        res.status(200).json({ data: images });
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }
};

export const caculateImageSize = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = parseInt(req.params.uid);
        const url = req.body.url;
        const productid = req.body.productid;
        const response = await limitedFetch(url);
        if (!response.ok) {
            throw new Error(`Error fetching! status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const megabytes = buffer.length / 1024 / 1024;

        const sourceLength = response.headers.get('source-length');

        const sizeInMB = parseInt(sourceLength) / 1000000
        let length = parseFloat(sizeInMB.toFixed(2));
        if (productid === "1") {
            length = parseFloat(megabytes.toFixed(2))
        }
        const uint8Array = new Uint8Array(buffer);
        const header = uint8Array.subarray(0, 4);
        let extension: Extenstion;
        if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
            extension = Extenstion.PNG;
        } else if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
            extension = Extenstion.GPEG;
        } else {
            extension = Extenstion.OTHERS;
        }
        const data = await db.image.update({
            where: {
                uid
            },
            data: {
                size: length,
                extension
            }
        })
        console.log("calculate size : ", uid, length, extension)
        res.status(200).json({ data });
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }
}

export const getImageThroughSSE = async (req: Request, res: Response): Promise<void> => {
    try {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
        res.setHeader("Access-Control-Allow-Credentials", "true")
        const images = await db.image.findMany();


        res.write(`event: SUCCESS\n`);
        res.write(`data: ${JSON.stringify(images)}\n\n`);

        res.write(`event: END\n`);
        res.write(`data: ${JSON.stringify(images)}\n\n`);
        res.end()
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }
};

export const getSingleImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.params.uid;

        const image = await db.image.findUnique({ where: { uid: parseInt(uid) } });

        res.status(200).json({ data: image });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}

export const getSingleImageManual = async (req: Request, res: Response): Promise<void> => {
    try {
        const uuid = req.params.uuid;

        const image = await db.image.findFirst({ where: { id: uuid } });

        res.status(200).json({ data: image });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}

export const getImageStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.params.uid;

        const image = await db.image.findUnique({ where: { uid: parseInt(uid) } });

        res.status(200).json({ status: image!.status });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching image status.' });
    }
}

export const compressImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const compressData = req.body;
        const access_token = req.header('Authorization')
        const { uid, productid, url, storeName, size, extension } = compressData;
        console.log('access_token', access_token)

        await db.image.update({
            where: { uid: parseInt(uid) },
            data: { status: 'ONGOING' },
        });

        io.emit('image_model', () => {
            console.log('an event occured in auto compression');
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

                const data = JSON.stringify({ uid, productid, url, storeName, size, extension, access_token });
                channel.sendToQueue(queue, Buffer.from(data));
                console.log(" [x] Sent to shopify_to_compressor %s", uid);

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
        const access_token = req.header('Authorization')
        const compressData = req.body;
        const { uid, productid, store_name } = compressData;

        const backupData = await db.backupimage.findFirst({
            where: {
                restoreId: `${uid}`
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
            where: { uid: parseInt(uid) },
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

                const data = JSON.stringify({ uid, productid, url, store_name, access_token });
                channel.sendToQueue(queue, Buffer.from(data));
                console.log(" [x] Sent %s", uid);

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
        const access_token = req.header('Authorization')
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
                const { uid, productId, url, size, extension } = image;
                await db.image.update({
                    where: { uid: uid },
                    data: { status: 'ONGOING' },
                });

                io.emit('image_model', () => {
                    console.log('an event occured in auto compression');
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

                        const data = JSON.stringify({ uid, productId, url, store_name, size, extension, access_token });
                        channel.sendToQueue(queue, Buffer.from(data));
                        console.log(" [x] Sent %s", uid);

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
        const access_token = req.header('Authorization')
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
                const { uid, productId } = image;

                const backupData = await db.backupimage.findFirst({
                    where: {
                        restoreId: uid.toString()
                    }
                })

                const url = backupData.url

                await db.image.update({
                    where: { uid: uid },
                    data: { status: 'RESTORING' },
                });

                io.emit('image_model', () => {
                    console.log('an event occured in auto restore');
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

                        const data = JSON.stringify({ uid, productId, url, store_name, access_token });
                        channel.sendToQueue(queue, Buffer.from(data));
                        console.log(" [x] Restore Sent %s", uid);

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
                const { uid } = image;

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

                        const data = JSON.stringify({ uid, store_name });
                        channel.sendToQueue(queue, Buffer.from(data));
                        console.log(" [x] Auto File Rename Sent %s", uid);

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
                const { uid } = image;

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

                        const data = JSON.stringify({ uid, store_name });
                        channel.sendToQueue(queue, Buffer.from(data));
                        console.log(" [x] Auto Alt Rename Sent %s", uid);

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
        const { uid, productid, compressedBuffer, storeName, access_token } = compressData;


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

                const data = JSON.stringify({ uid, productid, compressedBuffer, storeName, access_token });

                channel.sendToQueue(queue, Buffer.from(data));
                console.log(" [x] Sent to compressor_to_uploader %s", uid);

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
        const { uid, productid, url, store_name, access_token } = compressData;

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

                const data = JSON.stringify({ uid, productid, url, store_name, access_token });
                channel.sendToQueue(queue, Buffer.from(data));
                console.log(" [x] Restore_Uploader Sent %s", uid);

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
        const uid = req.params.uid;

        const image = await db.image.delete({ where: { uid: parseInt(uid) } });

        res.status(200).json({ status: image });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching image status.' });
    }
}