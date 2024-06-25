import { Request, Response } from "express";

const jwt = require('jsonwebtoken');

export const tokenDecode = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = jwt.verify(req.body.token, process.env.JWT_SECRET_KEY);

        res.status(200).json({ data });
    } catch (e) {
        res.status(400).json({ error: 'something went wrong!' })
    }

}