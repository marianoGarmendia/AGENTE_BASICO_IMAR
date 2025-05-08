import { Router } from "express";

import { post_lead } from "../api_zoho/post_lead.js";
import { getLeads } from "../api_zoho/get_leads.js";

export const leadsRouter = Router();

leadsRouter.post("/create", post_lead)

