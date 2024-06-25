import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as jwt from 'jsonwebtoken'

const db = new PrismaClient();

export const getAllSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.header('Authorization')

        if (!token) {
            res.status(401).json({ error: 'No token,authorization denied!' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const subscriptionPlan = await db.subscriptionPlan.findMany();

        res.status(200).json({ data: subscriptionPlan });
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }
};

export const getSingleSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.header('Authorization')

        if (!token) {
            res.status(401).json({ error: 'No token,authorization denied!' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const subscriptionPlanId = req.params.id;

        const subscriptionPlan = await db.subscriptionPlan.findUnique({ where: { id: parseInt(subscriptionPlanId) } });

        res.status(200).json({ data: subscriptionPlan });
    } catch (error) {
        res.status(404).json({ error: 'An error occurred while fetching sbuscription plan.' });
    }
}

export const createSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.header('Authorization')

        if (!token) {
            res.status(401).json({ error: 'No token,authorization denied!' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const { name, bandwidth, price } = req.body;

        const data = await db.subscriptionPlan.create({
            data: {
                name,
                bandwidth,
                price: parseFloat(price)
            }
        })

        console.log("subscription create ",data)

        res.status(201).json({ success: data })

    } catch (error) {
        res.status(500).json({ error: 'An error occurred while creating subscription plan.' });
    }
}

export const editSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.header('Authorization')

        if (!token) {
            res.status(401).json({ error: 'No token,authorization denied!' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const subscriptionPlanId = req.params.id
        const { name, bandwidth, price } = req.body;

        const data = await db.subscriptionPlan.update({
            where: {
                id: parseInt(subscriptionPlanId)
            },
            data: {
                name,
                bandwidth,
                price: parseFloat(price)
            }
        })

        res.status(201).json({ success: data })

    } catch (error) {
        res.status(500).json({ error: 'An error occurred while creating subscription plan.' });
    }
}

export const deleteSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.header('Authorization')

        if (!token) {
            res.status(401).json({ error: 'No token,authorization denied!' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const ids = req.body.ids;

        console.log(ids)

        const data = await db.subscriptionPlan.deleteMany({
            where: {
                id: {
                    in: ids,
                }
            }
        })


        res.status(200).json({ success: data })

    } catch (error) {
        res.status(500).json({ error: 'An error occurred while creating subscription plan.' });
    }
}
