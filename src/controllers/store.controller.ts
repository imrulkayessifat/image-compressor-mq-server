import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

import * as jwt from 'jsonwebtoken'

const db = new PrismaClient();

export const getSingleStoreData = async (req: Request, res: Response): Promise<void> => {

    try {
        const response = await db.store.findFirst({
            where: {
                name: req.body.storeName
            }
        })

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

        res.status(200).json({ data: response });
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }


}

export const getAllStoreData = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.header('Authorization')

        if (!token) {
            res.status(401).json({ error: 'No token,authorization denied!' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const response = await db.store.findMany();
        res.status(200).json({ data: response })
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }

}

export const getStoreToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const storeData = await db.store.findFirst({
            where: {
                name: req.body.storeName
            }
        })

        const token = jwt.sign(storeData, process.env.JWT_SECRET_KEY);

        res.status(200).json({ token })
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }

}

export const updateStoreAutoCompression = async (req: Request, res: Response): Promise<void> => {

    try {
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
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }

}

export const updateStoreAutoFileRename = async (req: Request, res: Response): Promise<void> => {
    try {
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
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }

}

export const updateStoreAutoAltRename = async (req: Request, res: Response): Promise<void> => {
    try {
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
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }

}

export const updateStoreCompressType = async (req: Request, res: Response): Promise<void> => {
    try {
        const response = await db.store.update({
            where: {
                name: req.body.store_name
            },
            data: {
                compressionType: req.body.compressionType
            }
        })

        res.status(200).json({ response })
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }

}

export const updateStoreCustomCompressType = async (req: Request, res: Response): Promise<void> => {
    try {
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
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }

}