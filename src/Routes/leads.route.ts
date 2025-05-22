import { Router } from "express";

import { post_lead } from "../api_zoho/post_lead.js";
;

export const leadsRouter = Router();

leadsRouter.post("/create", post_lead)

