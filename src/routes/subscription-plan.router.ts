import { Router } from "express";

import {
    getAllSubscriptionPlan,
    getSingleSubscriptionPlan,
    createSubscriptionPlan,
    editSubscriptionPlan,
    deleteSubscriptionPlan
} from "../controllers/subscription-plan.controller";

const subscriptionPlanRouter = Router();

subscriptionPlanRouter.get("/", getAllSubscriptionPlan);
subscriptionPlanRouter.get("/:id", getSingleSubscriptionPlan);
subscriptionPlanRouter.post('/', createSubscriptionPlan)
subscriptionPlanRouter.put('/:id', editSubscriptionPlan)
subscriptionPlanRouter.delete('/:id', deleteSubscriptionPlan)

export default subscriptionPlanRouter;