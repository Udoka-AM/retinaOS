import { createPublicClient, http } from "viem";
import { env } from "../config/env.js";

export const rpc = createPublicClient({
  transport: http(env.rpcHttpUrl),
});
