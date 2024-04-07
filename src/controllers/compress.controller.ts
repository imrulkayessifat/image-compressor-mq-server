import { Request, Response } from "express";
const amqp = require('amqplib/callback_api');

export const compressData = async (req: Request, res: Response): Promise<void> => {

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

        res.status(201).json({ data: compressData });
    } catch (e) {
        res.status(500).json({ error: 'An error occurred while compressing image.' });
    }

};