import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

import * as jwt from 'jsonwebtoken'

const db = new PrismaClient();

export const getSingleStoreData = async (req: Request, res: Response): Promise<void> => {

    try {
        const access_token = req.body.access_token;
        let response = await db.store.findFirst({
            where: {
                name: req.body.storeName
            }
        })

        console.log("debug : ", response, req.body.storeName,access_token)

        if (response === null && req.body.storeName !== "undefined") {
            response = await db.store.create({
                data: {
                    name: `${req.body.storeName}`
                }
            })

            console.log("store created")
            await db.product.create({
                data: {
                    id: '1',
                    title: 'uploadcare',
                    product_title: 'uploadcare',
                    storename: `${req.body.storeName}`
                }
            })
            console.log("product created")

            await db.filerename.create({
                data: {
                    id: '1',
                    storename: `${req.body.storeName}`
                }
            })

            console.log("filename created")

            await db.altrename.create({
                data: {
                    id: '1',
                    storename: `${req.body.storeName}`
                }
            })

            console.log("altname created")
        }

        const productsReq = await fetch(`https://${req.body.storeName}/admin/api/2024-04/products.json`, {
            headers: {
                'X-Shopify-Access-Token': `${access_token}`,
            },
        })

        const { products } = await productsReq.json();

        console.log("get products")

        for (const product of products) {

            const { id, images } = product

            const productExits = await db.product.findFirst({
                where: {
                    id: id.toString()
                }
            })

            if (!productExits) {
                const productRes = await db.product.create({
                    data: {
                        id: id.toString(),
                        storename: req.body.storeName,
                        title: product.title,
                    }
                })
            }

            for (const image of images) {
                const { id: imageId, src: url, alt } = image
                const imageIdStr = imageId.toString();
                const newUrl = new URL(url);
                const name = newUrl.pathname.split('/').pop() || null;

                const imageExist = await db.image.findFirst({
                    where: {
                        id: imageIdStr
                    }
                })

                if (!imageExist) {
                    const imageRes = await db.image.create({
                        data: {
                            id: imageIdStr,
                            url,
                            name: alt || name,
                            alt: alt || name,
                            fileRename: false,
                            altRename: false,
                            productId: id.toString(),
                            status: 'NOT_COMPRESSED',
                            storename: `${req.body.storeName}`
                        }
                    })
                    console.log("image created")
                }

            }

        }

        console.log("store response", response)

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
                    'Authorization': `${req.header('Authorization')}`,
                    'Shop': `${req.header('Shop')}`
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