import { Router } from "express";

export const tratoRouter = Router();

import { post_trato } from "../api_zoho/post_trato.js";

tratoRouter.post("/create", post_trato);