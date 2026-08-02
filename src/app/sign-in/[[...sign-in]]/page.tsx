import { EmailAuthForm } from "@/components/auth/email-auth-form";

export default function SignInPage() {
  return (
    <main>
      <EmailAuthForm intent="sign-in" />
    </main>
  );
}
