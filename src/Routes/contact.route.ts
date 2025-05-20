import { Router } from "express";

import { post_contact } from "../api_zoho/post_contacts.js";


export const leadsRouter = Router();

leadsRouter.post("/create", post_contact)

