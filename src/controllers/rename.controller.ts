import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

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

    const image_id = req.body.id;
    const storeName = req.body.storeName;

    console.log("image id : ", image_id)

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

    console.log(trueFields)

    const imageReq = await db.image.findFirst({
        where: {
            id: image_id
        },
    })

    await db.backupfilename.create({
        data: {
            restoreId: `${imageReq.id}`,
            name: imageReq.name
        }
    })

    console.log("image req :", imageReq)

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

    console.log(result)

    const concatenatedValues = Object.values(result)
        .filter(value => value !== '')
        .join('-');

    console.log(concatenatedValues)

    const imageRename = `${concatenatedValues}-${image_id}.${imageReq?.name?.split('.').pop()}`

    console.log("image name : ", imageRename)

    const updateImageName = await db.image.update({
        where: {
            id: image_id
        },
        data: {
            name: imageRename,
            fileRename: true
        }
    })

    res.status(200).json({ data: updateImageName })

}

export const restoreFileName = async (req: Request, res: Response): Promise<void> => {

    const restoreId = req.body.restoreId;

    const restoreImageData = await db.backupfilename.findFirst({
        where:{
            restoreId
        }
    })

    const updateFileName = await db.image.update({
        where:{
            id:restoreId
        },
        data:{
            name:restoreImageData.name,
            fileRename:false
        }
    })

    const data = await db.backupfilename.delete({
        where:{
            restoreId
        }
    })

    res.status(200).json({ data })

}

export const altRename = async (req: Request, res: Response): Promise<void> => {
    const image_id = req.body.id;
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
            id: image_id
        },
    })

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

    const altrename = `${concatenatedValues}-${image_id}.${imageReq?.name?.split('.').pop()}`

    const updateImageAltTag = await db.image.update({
        where: {
            id: image_id
        },
        data: {
            alt: altrename,
            altRename: true
        }
    })

    res.status(200).json({ data: updateImageAltTag })
}