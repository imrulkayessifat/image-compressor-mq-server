import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { io } from "../index";

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

    io.emit('image_model',()=>{
        console.log('an event occured in auto compression');
    });

    res.status(200).json({ data: updateImageName })

}

export const restoreFileName = async (req: Request, res: Response): Promise<void> => {

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

    const data = await db.backupfilename.delete({
        where: {
            restoreId
        }
    })

    res.status(200).json({ data })

}

export const altRename = async (req: Request, res: Response): Promise<void> => {
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
        where:{
            restoreId:`${imageReq.uid}`
        }
    })

    if(isBackupAltTagExist === null){
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

    io.emit('image_model',()=>{
        console.log('an event occured in auto compression');
    });

    res.status(200).json({ data: updateImageAltTag })
}

export const restoreAltTag = async (req: Request, res: Response): Promise<void> => {

    const restoreId = req.body.restoreId;

    const restoreImageData = await db.backupaltname.findFirst({
        where: {
            restoreId
        }
    })

    const updateFileName = await db.image.update({
        where: {
            uid: parseInt(restoreId)
        },
        data: {
            alt: restoreImageData.alt,
            altRename: false
        }
    })


    const data = await db.backupaltname.delete({
        where: {
            restoreId
        }
    })

    res.status(200).json({ data })

}