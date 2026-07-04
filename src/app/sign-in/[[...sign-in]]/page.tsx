import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { SiteHeader } from "@/components/site-header";

export default function SignInPage() {
  return (
    <main>
      <SiteHeader />
      <EmailAuthForm intent="sign-in" />
    </main>
  );
}
