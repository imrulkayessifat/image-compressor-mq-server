import { Request, Response, NextFunction } from "express";

export const verifyRequest = async (req: Request, res: Response, next: NextFunction) => {
    const shopifyAccessToken = req.header('Authorization')
    const shop = req.header('Shop')

    if (!shop || !shopifyAccessToken) {
        return res.status(401).send('Unauthorized');
    }

    console.log("shopify access token middleware :", shop, shopifyAccessToken)

    try {
        const response = await fetch(`https://${shop}/admin/api/2024-04/shop.json`, {
            headers: {
                'X-Shopify-Access-Token': shopifyAccessToken
            }
        });
        if (response.status === 200) {
            return next();
        } else {
            const errorDetails = await response.text();
            console.log("error details : ", errorDetails)
            return res.status(401).send('Unauthorized');
        }
    } catch (error) {
        console.log("ppppp")
        return res.status(401).send('Unauthorized');
    }
}