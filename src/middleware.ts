import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/account(.*)",
  "/upload(.*)",
  "/api(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const isPublicApi =
    request.nextUrl.pathname === "/api/comments" ||
    request.nextUrl.pathname === "/api/recordings";

  if (isProtectedRoute(request) && !isPublicApi) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
