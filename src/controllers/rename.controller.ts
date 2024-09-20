import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { io } from "../index";
import { rateLimiter } from "../middleware/rate-limiter";

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

const db = new PrismaClient();

interface FileRenameProps {
    id: string;
    product_vendor: boolean;
    variant_title: boolean;
    product_page_title: boolean;
    product_type: boolean;
    product_barcode: boolean;
    product_title: boolean;
    product_sku: boolean;
    storename: string;
}

export const fileRename = async (req: Request, res: Response): Promise<void> => {
    try {
        const access_token = req.header('Authorization')
        const uid = req.body.uid;
        const storeName = req.body.storeName;

        const store = await db.store.findFirst({
            where: {
                name: storeName
            }
        })

        if (store.plan == 'FREE') {
            res.status(403).json({ error: "don't have premium subscription" })
        }

        const fileRename = await db.filerename.findFirst({
            where: {
                storename: storeName
            }
        })

        const trueFields = Object.keys(fileRename).filter((key) => {
            return fileRename[key as keyof FileRenameProps] === true;
        });

        const imageReq = await db.image.findFirst({
            where: {
                uid: parseInt(uid)
            },
        })

        const isBackupFileNameAvailable = await db.backupfilename.findFirst({
            where: {
                restoreId: `${imageReq.uid}`
            }
        })

        if (isBackupFileNameAvailable === null) {
            await db.backupfilename.create({
                data: {
                    restoreId: `${imageReq.uid}`,
                    name: imageReq.name
                }
            })
        }

        if (!imageReq) {
            res.status(404).json({ error: "Image not found" });
        }

        const productReq = await db.product.findFirst({
            where: {
                id: imageReq?.productId
            }
        })

        if (!productReq) {
            res.status(404).json({ error: "Product not found" });
        }

        const result = trueFields.reduce((acc, field) => {
            acc[field] = productReq[field as keyof typeof productReq];
            return acc;
        }, {} as Record<string, any>);

        const concatenatedValues = Object.values(result)
            .filter(value => value !== '')
            .join('-');

        const imageRename = `${concatenatedValues}-${uid}.${imageReq?.name?.split('.').pop()}`

        console.log("file name:", imageRename)
        const updateImageName = await db.image.update({
            where: {
                uid: parseInt(uid)
            },
            data: {
                name: imageRename,
                fileRename: true
            }
        })

        const imagePath = await limitedFetch(imageReq.url);
        if (!imagePath.ok) {
            throw new Error(`Error fetching! status: ${imagePath.status}`);
        }

        const arrayBuffer = await imagePath.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = Buffer.from(buffer).toString('base64');
        const image = {
            filename: imageRename,
            attachment: base64Image,
            alt: imageReq.alt,
            metafields: [
                {
                    key: "filename",
                    value: `${uid}-name`,
                    type: "string",
                    namespace: "custom"
                }
            ]
        }

        const deleteImage = await rateLimiter(`https://${storeName}/admin/api/2024-01/products/${imageReq.productId}/images/${imageReq.id}.json`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': access_token
            }
        });
        const deleteImageRes = await deleteImage.json();

        if (deleteImage.status === 200) {
            const response = await rateLimiter(`https://${storeName}/admin/api/2024-01/products/${imageReq.productId}/images.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': access_token
                },
                body: JSON.stringify({ image })
            });

            const data = await response.json();
        }

        io.emit('image_model', () => {
            console.log('an event occured in file rename');
        });

        res.status(200).json({ data: updateImageName })
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }


}

export const autoFileRename = async (req: Request, res: Response): Promise<void> => {
    try {
        const access_token = req.header('Authorization')
        const uid = req.body.uid;
        const storeName = req.body.storeName;

        const store = await db.store.findFirst({
            where: {
                name: storeName
            }
        })

        if (store.plan == 'FREE') {
            res.status(403).json({ error: "don't have premium subscription" })
        }

        const fileRename = await db.filerename.findFirst({
            where: {
                storename: storeName
            }
        })

        const trueFields = Object.keys(fileRename).filter((key) => {
            return fileRename[key as keyof FileRenameProps] === true;
        });

        const imageReq = await db.image.findFirst({
            where: {
                uid: parseInt(uid)
            },
        })

        const isBackupFileNameAvailable = await db.backupfilename.findFirst({
            where: {
                restoreId: `${imageReq.uid}`
            }
        })

        if (isBackupFileNameAvailable === null) {
            await db.backupfilename.create({
                data: {
                    restoreId: `${imageReq.uid}`,
                    name: imageReq.name
                }
            })
        }

        if (!imageReq) {
            res.status(404).json({ error: "Image not found" });
        }

        const productReq = await db.product.findFirst({
            where: {
                id: imageReq?.productId
            }
        })

        if (!productReq) {
            res.status(404).json({ error: "Product not found" });
        }

        const result = trueFields.reduce((acc, field) => {
            acc[field] = productReq[field as keyof typeof productReq];
            return acc;
        }, {} as Record<string, any>);

        const concatenatedValues = Object.values(result)
            .filter(value => value !== '')
            .join('-');

        const imageRename = `${concatenatedValues}-${uid}.${imageReq?.name?.split('.').pop()}`

        const updateImageName = await db.image.update({
            where: {
                uid: parseInt(uid)
            },
            data: {
                name: imageRename,
                fileRename: true
            }
        })

        const imagePath = await limitedFetch(imageReq.url);
        if (!imagePath.ok) {
            throw new Error(`Error fetching! status: ${imagePath.status}`);
        }

        const arrayBuffer = await imagePath.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = Buffer.from(buffer).toString('base64');
        const image = {
            filename: imageRename,
            attachment: base64Image,
            alt: imageReq.alt,
            metafields: [
                {
                    key: "filename",
                    value: `${uid}-name`,
                    type: "string",
                    namespace: "custom"
                }
            ]
        }

        const deleteImage = await rateLimiter(`https://${storeName}/admin/api/2024-01/products/${imageReq.productId}/images/${imageReq.id}.json`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': access_token
            }
        });
        const deleteImageRes = await deleteImage.json();

        if (deleteImage.status === 200) {
            const response = await rateLimiter(`https://${storeName}/admin/api/2024-01/products/${imageReq.productId}/images.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': access_token
                },
                body: JSON.stringify({ image })
            });

            const data = await response.json();
        }

        io.emit('image_model', () => {
            console.log('an event occured in file rename');
        });

        res.status(200).json({ data: updateImageName })
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }


}

export const restoreFileName = async (req: Request, res: Response): Promise<void> => {
    try {
        const access_token = req.header('Authorization')
        const storeName = req.header('Shop')
        const restoreId = req.body.restoreId;

        const restoreImageData = await db.backupfilename.findFirst({
            where: {
                restoreId
            }
        })

        const updateFileName = await db.image.update({
            where: {
                uid: parseInt(restoreId)
            },
            data: {
                name: restoreImageData.name,
                fileRename: false
            }
        })

        const deleted = await db.backupfilename.delete({
            where: {
                restoreId
            }
        })

        const imagePath = await limitedFetch(updateFileName.url);
        if (!imagePath.ok) {
            throw new Error(`Error fetching! status: ${imagePath.status}`);
        }

        const arrayBuffer = await imagePath.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = Buffer.from(buffer).toString('base64');
        const image = {
            filename: updateFileName.name,
            attachment: base64Image,
            alt: updateFileName.alt,
            metafields: [
                {
                    key: "filename",
                    value: `${restoreId}-name`,
                    type: "string",
                    namespace: "custom"
                }
            ]
        }

        const deleteImage = await rateLimiter(`https://${storeName}/admin/api/2024-01/products/${updateFileName.productId}/images/${updateFileName.id}.json`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': access_token
            }
        });
        const deleteImageRes = await deleteImage.json();

        if (deleteImage.status === 200) {
            const response = await rateLimiter(`https://${storeName}/admin/api/2024-01/products/${updateFileName.productId}/images.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': access_token
                },
                body: JSON.stringify({ image })
            });

            const data = await response.json();
        }

        res.status(200).json({ updateFileName })
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }


}

export const altRename = async (req: Request, res: Response): Promise<void> => {
    try {
        const access_token = req.header('Authorization')
        const uid = req.body.uid;
        const storeName = req.body.storeName;

        const store = await db.store.findFirst({
            where: {
                name: storeName
            }
        })

        if (store.plan == 'FREE') {
            res.status(403).json({ error: "don't have premium subscription" })
        }

        const altRename = await db.altrename.findFirst({
            where: {
                storename: storeName
            }
        })

        const trueFields = Object.keys(altRename).filter((key) => {
            return altRename[key as keyof FileRenameProps] === true;
        });

        const imageReq = await db.image.findFirst({
            where: {
                uid: parseInt(uid)
            },
        })

        const isBackupAltTagExist = await db.backupaltname.findFirst({
            where: {
                restoreId: `${imageReq.uid}`
            }
        })

        if (isBackupAltTagExist === null) {
            await db.backupaltname.create({
                data: {
                    restoreId: `${imageReq.uid}`,
                    alt: imageReq.alt
                }
            })
        }

        if (!imageReq) {
            res.status(404).json({ error: "Product not found" });
        }

        const productReq = await db.product.findFirst({
            where: {
                id: imageReq?.productId
            }
        })

        if (!productReq) {
            res.status(404).json({ error: "Product not found" });
        }

        const result = trueFields.reduce((acc, field) => {
            acc[field] = productReq[field as keyof typeof productReq];
            return acc;
        }, {} as Record<string, any>);

        const concatenatedValues = Object.values(result)
            .filter(value => value !== '')
            .join('-');

        const altrename = `${concatenatedValues}-${uid}.${imageReq?.name?.split('.').pop()}`

        const updateImageAltTag = await db.image.update({
            where: {
                uid: parseInt(uid)
            },
            data: {
                alt: altrename,
                altRename: true
            }
        })

        const image = {
            alt: altrename
        }


        const response = await rateLimiter(`https://${storeName}/admin/api/2024-01/products/${imageReq.productId}/images/${imageReq.id}.json`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': access_token
            },
            body: JSON.stringify({ image })
        });

        const data = await response.json();

        console.log("alt rename :",data)

        io.emit('image_model', () => {
            console.log('an event occured in alt rename');
        });

        res.status(200).json({ data: updateImageAltTag })
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }

}

export const autoAltRename = async (req: Request, res: Response): Promise<void> => {
    try {
        const access_token = req.header('Authorization')
        const uid = req.body.uid;
        const storeName = req.body.storeName;

        const store = await db.store.findFirst({
            where: {
                name: storeName
            }
        })

        if (store.plan == 'FREE') {
            res.status(403).json({ error: "don't have premium subscription" })
        }

        const altRename = await db.altrename.findFirst({
            where: {
                storename: storeName
            }
        })

        const trueFields = Object.keys(altRename).filter((key) => {
            return altRename[key as keyof FileRenameProps] === true;
        });

        const imageReq = await db.image.findFirst({
            where: {
                uid: parseInt(uid)
            },
        })

        const isBackupAltTagExist = await db.backupaltname.findFirst({
            where: {
                restoreId: `${imageReq.uid}`
            }
        })

        if (isBackupAltTagExist === null) {
            await db.backupaltname.create({
                data: {
                    restoreId: `${imageReq.uid}`,
                    alt: imageReq.alt
                }
            })
        }

        if (!imageReq) {
            res.status(404).json({ error: "Product not found" });
        }

        const productReq = await db.product.findFirst({
            where: {
                id: imageReq?.productId
            }
        })

        if (!productReq) {
            res.status(404).json({ error: "Product not found" });
        }

        const result = trueFields.reduce((acc, field) => {
            acc[field] = productReq[field as keyof typeof productReq];
            return acc;
        }, {} as Record<string, any>);

        const concatenatedValues = Object.values(result)
            .filter(value => value !== '')
            .join('-');

        const altrename = `${concatenatedValues}-${uid}.${imageReq?.name?.split('.').pop()}`

        const updateImageAltTag = await db.image.update({
            where: {
                uid: parseInt(uid)
            },
            data: {
                alt: altrename,
                altRename: true
            }
        })

        const image = {
            alt: altrename
        }


        const response = await rateLimiter(`https://${storeName}/admin/api/2024-01/products/${imageReq.productId}/images/${imageReq.id}.json`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': access_token
            },
            body: JSON.stringify({ image })
        });

        const data = await response.json();

        io.emit('image_model', () => {
            console.log('an event occured in alt rename');
        });

        res.status(200).json({ data: updateImageAltTag })
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }

}

export const restoreAltTag = async (req: Request, res: Response): Promise<void> => {
    try {
        const access_token = req.header('Authorization')
        const storeName = req.header('Shop')
        const restoreId = req.body.restoreId;

        const restoreImageData = await db.backupaltname.findFirst({
            where: {
                restoreId
            }
        })

        const updateAltName = await db.image.update({
            where: {
                uid: parseInt(restoreId)
            },
            data: {
                alt: restoreImageData.alt,
                altRename: false
            }
        })


        const deleted = await db.backupaltname.delete({
            where: {
                restoreId
            }
        })

        const image = {
            alt: updateAltName.alt
        }

        const response = await rateLimiter(`https://${storeName}/admin/api/2024-01/products/${updateAltName.productId}/images/${updateAltName.id}.json`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': access_token
            },
            body: JSON.stringify({ image })
        });

        const data = await response.json();

        res.status(200).json({ data })
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }


}