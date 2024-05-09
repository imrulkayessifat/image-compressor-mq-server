import cors from 'cors';
import express from 'express';
import amqp from 'amqplib/callback_api';
import { PrismaClient } from "@prisma/client";

import subscribeRouter from './routes/subscribe.router';
import storeRouter from './routes/store.router';
import renameRouter from './routes/rename.router';

const app = express();
const port = process.env.PORT || 3001;
const db = new PrismaClient();

app.use(cors());
app.use(express.json());
app.options('*', cors());

app.use("/store", storeRouter);
app.use("/subscribe", subscribeRouter);
app.use("/rename", renameRouter);

app.get("/", (req, res) => {
    res.json({ message: "demo response" }).status(200);
});

app.post("/compress-image", async (req, res) => {
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
});

app.post("/upload-image", async (req, res) => {
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
});

const retryPendingTasks = async () => {
    try {
        const pendingTasks = await db.image.findMany({
            where: { status: 'ONGOING' },
        });

        if (pendingTasks.length > 0) {
            amqp.connect('amqp://localhost', (error0, connection) => {
                if (error0) {
                    throw error0;
                }
                connection.createChannel((error1, channel) => {
                    if (error1) {
                        throw error1;
                    }

                    const queue = 'periodic_update';
                    channel.assertQueue(queue, { durable: false });

                    for (const task of pendingTasks) {
                        const data = JSON.stringify({
                            id: task.id,
                            productid: task.productId,
                            url: task.url,
                        });

                        channel.sendToQueue(queue, Buffer.from(data));
                    }

                    setTimeout(() => {
                        connection.close();
                    }, 500);
                });
            });

            console.log(`Enqueued ${pendingTasks.length} tasks to RabbitMQ.`);
        } else {
            console.log('No pending tasks found.');
        }
    } catch (error) {
        console.error("Error retrying pending tasks:", error);
    }
};

// setInterval(retryPendingTasks, 10000);

app.listen(port, () => {
    console.log(`Server up and running on port: ${port}`);
});
