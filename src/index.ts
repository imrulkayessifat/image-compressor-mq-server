import express from 'express';
import cors from 'cors';
const amqp = require('amqplib/callback_api');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json())

app.use(cors());
app.options('*', cors());


app.get("/", (req, res) => {
    res.json({ message: "demo response" }).status(200)
})

app.post("/compress-image", async (req, res) => {
    try {
        const compressData = req.body;

        const { id } = compressData;
        amqp.connect('amqp://localhost', function (error0: any, connection: { createChannel: (arg0: (error1: any, channel: any) => void) => void; close: () => void; }) {
            if (error0) {
                throw error0;
            }
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    throw error1;
                }

                const queue = 'image_queue';

                channel.assertQueue(queue, {
                    durable: false
                });

                channel.sendToQueue(queue, Buffer.from(id));
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


app.listen(port, () => {
    console.log(`server up and running on port: ${port}`)
})

