import amqp from 'amqplib/callback_api';
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
    fileInfo,
    UploadcareSimpleAuthSchema,
} from '@uploadcare/rest-client';

const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
    publicKey: 'c0bc9dbd97f5de75c062',
    secretKey: '2c761a29414fbe65588d',
});


const db = new PrismaClient();

export const getFileInfo = async (req: Request, res: Response): Promise<void> => {
    try {
        const fileId = req.params.id;
        const result = await fileInfo(
            {
                uuid: `${fileId}`,
            },
            { authSchema: uploadcareSimpleAuthSchema }
        )

        res.status(200).json({ data: result });
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }
};