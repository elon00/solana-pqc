import { requireHostedWalletAuth } from "../backend/src/auth.mjs";
import { handler } from "../backend/src/server.mjs";

requireHostedWalletAuth();

export default handler;
