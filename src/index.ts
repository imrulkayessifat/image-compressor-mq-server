import express from 'express';
import cors from 'cors';
import { PrismaClient } from "@prisma/client";

const amqp = require('amqplib/callback_api');

const app = express();
const port = process.env.PORT || 3001;

import subscribeRouter from './routes/subscribe.router';
import storeRouter from './routes/store.router';
import renameRouter from './routes/rename.router';

app.use(express.json())

app.use(cors());
app.options('*', cors());

const db = new PrismaClient();

app.use("/store", storeRouter)
app.use("/subscribe", subscribeRouter)
app.use("/rename",renameRouter)

app.get("/", (req, res) => {
    res.json({ message: "demo response" }).status(200)
})

app.post("/compress-image", async (req, res) => {
    try {
        const compressData = req.body;

        const { id, productid, url, storeName } = compressData;

        await db.image.update({
            where: { id: id },
            data: { status: 'ONGOING' },
        });

        amqp.connect('amqp://localhost', function (error0: any, connection: { createChannel: (arg0: (error1: any, channel: any) => void) => void; close: () => void; }) {
            if (error0) {
                throw error0;
            }
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    throw error1;
                }

                const queue = 'shopify_to_compressor';

                channel.assertQueue(queue, {
                    durable: false
                });
                const data = JSON.stringify({ id, productid, url, storeName });
                channel.sendToQueue(queue, Buffer.from(data));
                console.log(" [x] Sent %s", id);
            });
            setTimeout(function () {
                connection.close();
            }, 500);
        });

        res.json({ status: 'Image compression started' });

    } catch (e) {
        res.status(500).json({ error: 'An error occurred while compressing image.' });
    }
})

app.post("/upload-image", async (req, res) => {
    try {
        const compressData = req.body;

        const { id, productid, compressedBuffer } = compressData;

        amqp.connect('amqp://localhost', function (error0: any, connection: { createChannel: (arg0: (error1: any, channel: any) => void) => void; close: () => void; }) {
            if (error0) {
                throw error0;
            }
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    throw error1;
                }

                const queue = 'compressor_to_uploader';

                channel.assertQueue(queue, {
                    durable: false
                });
                const data = JSON.stringify({ id, productid, compressedBuffer });
                channel.sendToQueue(queue, Buffer.from(data));
                console.log(" [x] Sent %s", id);
            });
            setTimeout(function () {
                connection.close();
            }, 500);
        });

        res.json({ status: 'Image Uploading started' });

    } catch (e) {
        res.status(500).json({ error: 'An error occurred while compressing image.' });
    }
})

const retryPendingTasks = async () => {
    const pendingTasks = await db.image.findMany({
        where: { status: 'ONGOING' },
    });
    if (pendingTasks.length > 0) {
        // Retry enqueueing each task to RabbitMQ
        amqp.connect('amqp://localhost', function (error0: any, connection: { createChannel: (arg0: (error1: any, channel: any) => void) => void; close: () => void; }) {
            if (error0) {
                throw error0;
            }
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    throw error1;
                }
                const queue = 'periodic_update';

                channel.assertQueue(queue, {
                    durable: false
                });

                // Enqueue each pending task
                for (const task of pendingTasks) {
                    const data = JSON.stringify({
                        id: task.id,
                        productid: task.productId,
                        url: task.url,
                    });

                    channel.sendToQueue(queue, Buffer.from(data));
                }

                setTimeout(function () {
                    connection.close();
                }, 500);
            });
        });

        console.log(`Enqueued ${pendingTasks.length} tasks to RabbitMQ.`);
    } else {
        console.log('No pending tasks found.');
    }
}

setInterval(retryPendingTasks, 10000);

app.listen(port, () => {
    console.log(`server up and running on port: ${port}`)
})

