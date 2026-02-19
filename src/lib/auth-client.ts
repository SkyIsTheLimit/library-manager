import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    // baseURL should be your app's URL
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL
});
