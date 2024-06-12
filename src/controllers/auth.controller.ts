import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { hashSync, compareSync } from 'bcrypt';
import * as jwt from 'jsonwebtoken'

const db = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET

export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body
        const userExit = db.user.findFirst({
            where: {
                email
            }
        })
        if (userExit) {
            res.status(409).json({ data: 'user already exists!' });
        }
        const user = await db.user.create({
            data: {
                email,
                password: hashSync(password, 10)
            }
        })
        res.status(201).json({
            data: 'user is created!'
        })
    } catch (e) {
        console.log(e);
    }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body

        const userExit = await db.user.findFirst({
            where: {
                email
            }
        })

        if (!userExit) {
            res.status(404).json({ error: 'user does not exists!' });
        }

        if (!compareSync(password, userExit.password)) {
            res.status(401).json({
                error: 'email or password is incorrect!!'
            })
        }
        const token = jwt.sign({
            user: userExit
        }, JWT_SECRET)

        res.status(200).json({
            data: token,
        })
    } catch (e) {
        console.log(e);
    }
};