import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { SiteHeader } from "@/components/site-header";

export default function SignUpPage() {
  return (
    <main>
      <SiteHeader />
      <EmailAuthForm intent="sign-up" />
    </main>
  );
}
