import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { getAccountReturnPath } from "@/lib/account-return-path";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const [{ userId }, query] = await Promise.all([auth(), searchParams]);
  const returnTo = getAccountReturnPath(query.redirect_url);

  if (userId) {
    redirect(returnTo);
  }

  return (
    <main>
      <EmailAuthForm intent="sign-in" returnTo={returnTo} />
    </main>
  );
}
