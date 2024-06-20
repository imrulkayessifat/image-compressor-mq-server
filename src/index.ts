import cors from 'cors';
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser'
import amqp from 'amqplib/callback_api';
import { PrismaClient } from "@prisma/client";

import subscribeRouter from './routes/subscribe.router';
import storeRouter from './routes/store.router';
import renameRouter from './routes/rename.router';
import imageRouter from './routes/image.router';
import backupRouter from './routes/backup.router';
import uploadcareRouter from './routes/uploadcare.router';
import jwtRouter from './routes/jwt.router';
import fileRename from './routes/filerename.router';
import altRename from './routes/altename.router';
import batchRouter from './routes/batch.router';
import authRouter from './routes/auth.router';
import subscriptionPlanRouter from './routes/subscription-plan.router';


const app = express();
const server = http.createServer(app)
const port = process.env.PORT || 3001;
const db = new PrismaClient();

const corsOptions = {
    origin: 'http://localhost:3000,https://app.photooptima.com',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '25mb' }));

// app.options();

app.use("/store", storeRouter);
app.use("/subscribe", subscribeRouter);
app.use("/rename", renameRouter);
app.use("/image", imageRouter)
app.use("/backup", backupRouter)
app.use("/uploadcare", uploadcareRouter)
app.use("/jwt", jwtRouter)
app.use("/filerename", fileRename)
app.use("/altrename", altRename)
app.use("/batch", batchRouter)
app.use("/auth", authRouter)
app.use("/subscription-plan", subscriptionPlanRouter)

app.get("/", (req, res) => {
    res.json({ message: "demo response from mq server" }).status(200);
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

        } else {
            console.log('No pending tasks found.');
        }
    } catch (error) {
        console.error("Error retrying pending tasks:", error);
    }
};

// setInterval(retryPendingTasks, 3000);


server.listen(port, () => {
    console.log(`Server up and running on port: ${port}`);
});
