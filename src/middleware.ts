import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    const { env } = await getCloudflareContext();
    const session = await auth(env.DB).api.getSession({
        headers: request.headers
    });

    const isAuthPage = request.nextUrl.pathname.startsWith("/signin");

    if (!session && !isAuthPage) {
        return NextResponse.redirect(new URL("/signin", request.url));
    }

    if (session && isAuthPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
