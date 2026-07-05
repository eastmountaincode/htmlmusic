"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";

export default function SsoCallbackPage() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const hasRun = useRef(false);
  const [message, setMessage] = useState("...");

  useEffect(() => {
    if (!clerk.loaded || !signIn || !signUp || hasRun.current) return;

    hasRun.current = true;

    const navigateHome = ({
      session,
      decorateUrl,
    }: {
      session: { currentTask?: unknown };
      decorateUrl: (url: string) => string;
    }) => {
      if (session.currentTask) {
        setMessage("Your account needs one more step.");
        return;
      }

      const url = decorateUrl("/");
      if (url.startsWith("http")) {
        window.location.href = url;
        return;
      }

      router.push(url);
    };

    const run = async () => {
      if ((signIn.status as string) === "complete") {
        await signIn.finalize({ navigate: navigateHome });
        return;
      }

      if (signUp.isTransferable) {
        const { error } = await signIn.create({ transfer: true });
        if (error) {
          setMessage(error.longMessage ?? error.message);
          return;
        }

        if ((signIn.status as string) === "complete") {
          await signIn.finalize({ navigate: navigateHome });
          return;
        }
      }

      if (
        signIn.status === "needs_first_factor" &&
        !signIn.supportedFirstFactors?.every(
          (factor) => factor.strategy === "enterprise_sso",
        )
      ) {
        router.push("/sign-in");
        return;
      }

      if (signIn.isTransferable) {
        const { error } = await signUp.create({ transfer: true });
        if (error) {
          setMessage(error.longMessage ?? error.message);
          return;
        }

        if ((signUp.status as string) === "complete") {
          await signUp.finalize({ navigate: navigateHome });
          return;
        }

        router.push("/sign-up");
        return;
      }

      if ((signUp.status as string) === "complete") {
        await signUp.finalize({ navigate: navigateHome });
        return;
      }

      if (signIn.status === "needs_second_factor") {
        router.push("/sign-in");
        return;
      }

      if (signIn.existingSession || signUp.existingSession) {
        const sessionId =
          signIn.existingSession?.sessionId || signUp.existingSession?.sessionId;

        if (sessionId) {
          await clerk.setActive({ session: sessionId, navigate: navigateHome });
          return;
        }
      }

      setMessage("The sign-in is waiting for more information.");
    };

    void run();
  }, [clerk, router, signIn, signUp]);

  return (
    <main className="auth-shell">
      <fieldset className="auth-fieldset">
        <legend>Google sign in</legend>
        <p>{message}</p>
        <div id="clerk-captcha" />
      </fieldset>
    </main>
  );
}
