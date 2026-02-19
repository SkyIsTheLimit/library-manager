import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { nextCookies } from "better-auth/next-js";
import * as schema from "./database/schema";

export const auth = (db: D1Database) => betterAuth({
    database: drizzleAdapter(drizzle(db, { schema }), {
        provider: "sqlite",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        }
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }
    },
    plugins: [
        nextCookies()
    ]
});
