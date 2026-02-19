import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const { GET, POST } = {
    GET: async (req: Request) => {
        const { env } = await getCloudflareContext();
        return toNextJsHandler(auth(env.DB)).GET(req);
    },
    POST: async (req: Request) => {
        const { env } = await getCloudflareContext();
        return toNextJsHandler(auth(env.DB)).POST(req);
    }
};
