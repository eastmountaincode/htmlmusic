import { EmailAuthForm } from "@/components/auth/email-auth-form";

export default function SignUpPage() {
  return (
    <main>
      <EmailAuthForm intent="sign-up" />
    </main>
  );
}
