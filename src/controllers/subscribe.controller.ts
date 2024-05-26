import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const db = new PrismaClient();

interface AccessTokenType {
    access_token: string;
    scope: string;
}

export const subscribeData = async (req: Request, res: Response): Promise<void> => {
    const charge = {
        recurring_application_charge: {
            name: req.body.plan,
            price: req.body.price,
            return_url: `http://localhost:3001/subscribe/confirmation?shop=${req.body.shop}`,
            test: true
        }
    }

    const accessTokenResponse = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'client_id': `${process.env.SHOPIFY_CLIENT_ID}`,
            'client_secret': `${process.env.SHOPIFY_CLIENT_SECRET}`,
            'grant_type': 'client_credentials'
        })
    })

    const accessToken = await accessTokenResponse.json() as AccessTokenType;

    const response = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/recurring_application_charges.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': `${accessToken.access_token}`,
        },
        body: JSON.stringify(charge)
    })
    const url = await response.json()
    
    res.status(201).json({ data: url });
}


export const confirmation = async (req: Request, res: Response): Promise<void> => {
    const { shop, charge_id } = req.query;

    const accessTokenResponse = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'client_id': `${process.env.SHOPIFY_CLIENT_ID}`,
            'client_secret': `${process.env.SHOPIFY_CLIENT_SECRET}`,
            'grant_type': 'client_credentials'
        })
    })

    const accessToken = await accessTokenResponse.json() as AccessTokenType;

    const response = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/recurring_application_charges/${charge_id}.json`, {
        headers: {
            'X-Shopify-Access-Token': `${accessToken.access_token}`
        },
    })

    const data = await response.json() as any;

    const chargeId = `${data.recurring_application_charge.id}`;
   
    if (data.recurring_application_charge.status === 'active') {
        await db.store.update({
            where: {
                name: `${shop}`
            },
            data: {
                plan: data.recurring_application_charge.name,
                chargeId: chargeId
            }
        })
    }
    res.send('Subscription activated successfully!');
}