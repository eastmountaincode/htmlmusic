"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import type { SetActiveNavigate } from "@clerk/nextjs/types";

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

    const navigateToAccount: SetActiveNavigate = ({ decorateUrl }) => {
      window.location.assign(decorateUrl("/account"));
    };

    const run = async () => {
      try {
        if (signIn.status === "complete") {
          const { error } = await signIn.finalize({
            navigate: navigateToAccount,
          });
          if (error) setMessage(error.longMessage ?? error.message);
          return;
        }

        if (signUp.isTransferable) {
          const { error } = await signIn.create({ transfer: true });
          if (error) {
            setMessage(error.longMessage ?? error.message);
            return;
          }

          // create() mutates this signal resource, which TypeScript cannot see.
          if ((signIn.status as string) === "complete") {
            const { error: finalizeError } = await signIn.finalize({
              navigate: navigateToAccount,
            });
            if (finalizeError) {
              setMessage(finalizeError.longMessage ?? finalizeError.message);
            }
            return;
          }

          router.replace("/sign-in");
          return;
        }

        if (
          signIn.status === "needs_first_factor" &&
          !signIn.supportedFirstFactors?.every(
            (factor) => factor.strategy === "enterprise_sso",
          )
        ) {
          router.replace("/sign-in");
          return;
        }

        if (signIn.isTransferable) {
          const { error } = await signUp.create({ transfer: true });
          if (error) {
            setMessage(error.longMessage ?? error.message);
            return;
          }

          if (signUp.status === "complete") {
            const { error: finalizeError } = await signUp.finalize({
              navigate: navigateToAccount,
            });
            if (finalizeError) {
              setMessage(finalizeError.longMessage ?? finalizeError.message);
            }
            return;
          }

          router.replace("/sign-up");
          return;
        }

        if (signUp.status === "complete") {
          const { error } = await signUp.finalize({
            navigate: navigateToAccount,
          });
          if (error) setMessage(error.longMessage ?? error.message);
          return;
        }

        if (
          signIn.status === "needs_second_factor" ||
          signIn.status === "needs_new_password"
        ) {
          router.replace("/sign-in");
          return;
        }

        if (signIn.existingSession || signUp.existingSession) {
          const sessionId =
            signIn.existingSession?.sessionId ??
            signUp.existingSession?.sessionId;

          if (sessionId) {
            await clerk.setActive({
              session: sessionId,
              navigate: navigateToAccount,
            });
            return;
          }
        }

        setMessage("The sign-in is waiting for more information.");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Google sign in failed.",
        );
      }
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
