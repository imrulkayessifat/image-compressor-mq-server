import { Router } from "express";

import {
    getAllSubscriptionPlan,
    getSingleSubscriptionPlanByName,
    getSingleSubscriptionPlan,
    createSubscriptionPlan,
    editSubscriptionPlan,
    deleteSubscriptionPlan
} from "../controllers/subscription-plan.controller";

const subscriptionPlanRouter = Router();

subscriptionPlanRouter.get("/", getAllSubscriptionPlan);
subscriptionPlanRouter.get("/:name", getSingleSubscriptionPlanByName);
subscriptionPlanRouter.get("/:id", getSingleSubscriptionPlan);
subscriptionPlanRouter.post('/', createSubscriptionPlan)
subscriptionPlanRouter.put('/:id', editSubscriptionPlan)
subscriptionPlanRouter.delete('/', deleteSubscriptionPlan)

export default subscriptionPlanRouter;