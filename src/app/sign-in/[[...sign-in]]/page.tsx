import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { EmailAuthForm } from "@/components/auth/email-auth-form";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/account");
  }

  return (
    <main>
      <EmailAuthForm intent="sign-in" />
    </main>
  );
}
