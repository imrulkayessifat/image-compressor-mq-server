import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const db = new PrismaClient();

export const fileRename = async (req: Request, res: Response): Promise<void> => {

    const image_id = req.body.id;
    const image_name = req.body.name;


    const imageReq = await db.image.findFirst({
        where: {
            id: image_id
        },
    })

    const productReq = await db.product.findFirst({
        where: {
            id: imageReq?.productId
        }
    })

    const imageRename = `${productReq?.title}-${image_id}.${imageReq?.name?.split('.').pop()}`

    const updateImageName = await db.image.update({
        where: {
            id: image_id
        },
        data: {
            name: imageRename
        }
    })

    res.status(200).json({ data: updateImageName })

}