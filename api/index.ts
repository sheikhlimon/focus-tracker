import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../server/src/index";

const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
