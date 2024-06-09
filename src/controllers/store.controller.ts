import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const jwt = require('jsonwebtoken');

const db = new PrismaClient();

export const getSingleStoreData = async (req: Request, res: Response): Promise<void> => {
    console.log("1",req.body.storeName)
    const response = await db.store.findFirst({
        where: {
            name: req.body.storeName
        }
    })

    console.log("2",response)

    if (response === null && req.body.storeName !== undefined) {
        await db.store.create({
            data: {
                name: `${req.body.storeName}`
            }
        })
        await db.product.create({
            data: {
                id: '1',
                title: 'uploadcare',
                product_title: 'uploadcare',
                storename: `${req.body.storeName}`
            }
        })
        await db.filerename.create({
            data: {
                id: '1',
                storename: `${req.body.storeName}`
            }
        })
        await db.altrename.create({
            data: {
                id: '1',
                storename: `${req.body.storeName}`
            }
        })
    }

    console.log("bug",response)

    res.status(200).json({ data: response });

}

export const getStoreToken = async (req: Request, res: Response): Promise<void> => {

    const storeData = await db.store.findFirst({
        where: {
            name: req.body.storeName
        }
    })

    const token = jwt.sign(storeData, process.env.JWT_SECRET_KEY);

    res.status(200).json({ token })
}

export const updateStoreAutoCompression = async (req: Request, res: Response): Promise<void> => {

    const response = await db.store.update({
        where: {
            name: req.body.store_name
        },
        data: {
            autoCompression: req.body.auto_compression
        }
    })

    if (response.autoCompression === true) {
        fetch(`${process.env.MQSERVER}/image/auto-compression`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ store_name: req.body.store_name })
        })
    }
    res.status(200).json({ response })

}

export const updateStoreAutoFileRename = async (req: Request, res: Response): Promise<void> => {

    const response = await db.store.update({
        where: {
            name: req.body.store_name
        },
        data: {
            autoFileRename: req.body.auto_file_rename
        }
    })

    if (response.autoFileRename === true) {
        fetch(`${process.env.MQSERVER}/image/auto-file-rename`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ store_name: req.body.store_name })
        })
    }

    res.status(200).json({ response })
}

export const updateStoreAutoAltRename = async (req: Request, res: Response): Promise<void> => {

    const response = await db.store.update({
        where: {
            name: req.body.store_name
        },
        data: {
            autoAltRename: req.body.auto_alt_rename
        }
    })

    if (response.autoAltRename === true) {
        fetch(`${process.env.MQSERVER}/image/auto-alt-rename`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ store_name: req.body.store_name })
        })
    }
    res.status(200).json({ response })
}

export const updateStoreCompressType = async (req: Request, res: Response): Promise<void> => {

    const response = await db.store.update({
        where: {
            name: req.body.store_name
        },
        data: {
            compressionType: req.body.compressionType
        }
    })

    res.status(200).json({ response })
}

export const updateStoreCustomCompressType = async (req: Request, res: Response): Promise<void> => {

    const response = await db.store.update({
        where: {
            name: req.body.store_name
        },
        data: {
            jpeg: req.body.jpeg,
            png: req.body.png,
            others: req.body.others
        }
    })

    res.status(200).json({ response })
}