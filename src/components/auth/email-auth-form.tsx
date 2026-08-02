"use client";

import Link from "next/link";
import { useClerk, useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import type { SetActiveNavigate } from "@clerk/nextjs/types";
import { FormEvent, useEffect, useState } from "react";

type AuthIntent = "sign-in" | "sign-up";
type ClerkLikeError = {
  code?: string;
  longMessage?: string;
  message?: string;
  errors?: Array<{
    code?: string;
    longMessage?: string;
    message?: string;
  }>;
};

function getErrorCode(error: unknown) {
  const clerkError = error as ClerkLikeError | null;
  return clerkError?.errors?.[0]?.code ?? clerkError?.code ?? null;
}

function getErrorMessage(error: unknown) {
  const clerkError = error as ClerkLikeError | null;
  return (
    clerkError?.errors?.[0]?.longMessage ??
    clerkError?.errors?.[0]?.message ??
    clerkError?.longMessage ??
    clerkError?.message ??
    "Something went wrong."
  );
}

export function EmailAuthForm({ intent }: { intent: AuthIntent }) {
  const clerk = useClerk();
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();
  const {
    signIn,
    errors: signInErrors,
    fetchStatus: signInFetchStatus,
  } = useSignIn();
  const {
    signUp,
    errors: signUpErrors,
    fetchStatus: signUpFetchStatus,
  } = useSignUp();

  const [emailAddress, setEmailAddress] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isUserLoaded && isSignedIn) {
      window.location.replace("/account");
    }
  }, [isSignedIn, isUserLoaded]);

  const isFetching =
    signInFetchStatus === "fetching" || signUpFetchStatus === "fetching";
  const hasMissingRequirements =
    signUp?.status === "missing_requirements" &&
    signUp.missingFields.length > 0;
  const pageTitle = intent === "sign-in" ? "Sign in" : "Create account";
  const alternate =
    intent === "sign-in" ? (
      <Link href="/sign-up">create account</Link>
    ) : (
      <Link href="/sign-in">sign in</Link>
    );

  const navigateAfterAuth: SetActiveNavigate = ({ decorateUrl }) => {
    window.location.assign(decorateUrl("/account"));
  };

  const activateExistingSession = async () => {
    const sessionId =
      signIn?.existingSession?.sessionId ?? signUp?.existingSession?.sessionId;

    if (!sessionId) return false;

    try {
      await clerk.setActive({
        session: sessionId,
        navigate: navigateAfterAuth,
      });
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      return true;
    }
  };

  const finalizeSignIn = async () => {
    if (!signIn) return;
    const { error } = await signIn.finalize({ navigate: navigateAfterAuth });
    if (error) setErrorMessage(getErrorMessage(error));
  };

  const finalizeSignUp = async () => {
    if (!signUp) return;
    const { error } = await signUp.finalize({ navigate: navigateAfterAuth });
    if (error) setErrorMessage(getErrorMessage(error));
  };

  const startEmailFlow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signIn) return;

    setErrorMessage("");
    setMessage("");

    const { error: createError } = await signIn.create({
      identifier: emailAddress,
      signUpIfMissing: true,
    });

    if (createError) {
      if (await activateExistingSession()) return;
      setErrorMessage(getErrorMessage(createError));
      return;
    }

    if (await activateExistingSession()) return;

    const { error: sendError } = await signIn.emailCode.sendCode();
    if (sendError) {
      setErrorMessage(getErrorMessage(sendError));
      return;
    }

    setVerifying(true);
    setMessage(`A code was sent to ${emailAddress}.`);
  };

  const handleTransferToSignUp = async () => {
    if (!signUp) return;

    const { error } = await signUp.create({ transfer: true });
    if (error) {
      if (await activateExistingSession()) return;
      setErrorMessage(getErrorMessage(error));
      return;
    }

    if (signUp.status === "complete") {
      await finalizeSignUp();
      return;
    }

    if (signUp.status === "missing_requirements") {
      setVerifying(false);
      setMessage("");
      return;
    }

    setErrorMessage(`Unexpected sign-up state: ${signUp.status}.`);
  };

  const verifyEmailCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signIn) return;

    setErrorMessage("");
    const { error } = await signIn.emailCode.verifyCode({ code });

    if (error) {
      if (await activateExistingSession()) return;
      if (getErrorCode(error) === "sign_up_if_missing_transfer") {
        await handleTransferToSignUp();
        return;
      }

      setErrorMessage(getErrorMessage(error));
      return;
    }

    if (signIn.status === "complete") {
      await finalizeSignIn();
      return;
    }

    setErrorMessage(`Unexpected sign-in state: ${signIn.status}.`);
  };

  const completeMissingRequirements = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!signUp) return;

    setErrorMessage("");
    const { error } = await signUp.update({
      firstName:
        signUp.missingFields.includes("first_name") && firstName
          ? firstName
          : undefined,
      lastName:
        signUp.missingFields.includes("last_name") && lastName
          ? lastName
          : undefined,
      legalAccepted: signUp.missingFields.includes("legal_accepted")
        ? legalAccepted
        : undefined,
    });

    if (error) {
      setErrorMessage(getErrorMessage(error));
      return;
    }

    if (signUp.status === "complete") {
      await finalizeSignUp();
      return;
    }

    setErrorMessage(`Still missing: ${signUp.missingFields.join(", ")}.`);
  };

  const signInWithGoogle = async () => {
    if (!signIn) return;

    setErrorMessage("");
    try {
      const { error } = await signIn.sso({
        strategy: "oauth_google",
        redirectCallbackUrl: "/sso-callback",
        redirectUrl: "/account",
      });

      if (error) {
        if (await activateExistingSession()) return;
        setErrorMessage(getErrorMessage(error));
      }
    } catch (error) {
      if (await activateExistingSession()) return;
      setErrorMessage(getErrorMessage(error));
    }
  };

  const resetFlow = async () => {
    await signIn?.reset();
    await signUp?.reset();
    setCode("");
    setErrorMessage("");
    setMessage("");
    setVerifying(false);
  };

  if (!signIn || !signUp) {
    return (
      <section className="auth-shell">
        <p>...</p>
      </section>
    );
  }

  return (
    <section className="auth-shell">
      <fieldset className="auth-fieldset">
        <legend>{pageTitle}</legend>

        {hasMissingRequirements ? (
          <form className="auth-form" onSubmit={completeMissingRequirements}>
            <p>Complete the remaining account fields.</p>

            {signUp.missingFields.includes("first_name") ? (
              <label>
                first name
                <input
                  autoComplete="given-name"
                  name="firstName"
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  type="text"
                  value={firstName}
                />
              </label>
            ) : null}

            {signUp.missingFields.includes("last_name") ? (
              <label>
                last name
                <input
                  autoComplete="family-name"
                  name="lastName"
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  type="text"
                  value={lastName}
                />
              </label>
            ) : null}

            {signUp.missingFields.includes("legal_accepted") ? (
              <label className="auth-checkbox">
                <input
                  checked={legalAccepted}
                  onChange={(event) => setLegalAccepted(event.target.checked)}
                  required
                  type="checkbox"
                />
                I agree to the terms.
              </label>
            ) : null}

            <div className="auth-actions">
              <button disabled={isFetching} type="submit">
                create account
              </button>
              <button onClick={resetFlow} type="button">
                start over
              </button>
            </div>
          </form>
        ) : verifying ? (
          <form className="auth-form" onSubmit={verifyEmailCode}>
            <p>{message}</p>
            <label>
              code
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                name="code"
                onChange={(event) => setCode(event.target.value)}
                required
                type="text"
                value={code}
              />
            </label>

            <div className="auth-actions">
              <button disabled={isFetching} type="submit">
                verify
              </button>
              <button
                disabled={isFetching}
                onClick={() => void signIn.emailCode.sendCode()}
                type="button"
              >
                resend
              </button>
              <button onClick={resetFlow} type="button">
                start over
              </button>
            </div>
          </form>
        ) : (
          <>
            <form className="auth-form" onSubmit={startEmailFlow}>
              <label>
                email
                <input
                  autoComplete="email"
                  name="email"
                  onChange={(event) => setEmailAddress(event.target.value)}
                  required
                  type="email"
                  value={emailAddress}
                />
              </label>

              <div className="auth-actions">
                <button disabled={isFetching} type="submit">
                  continue with email
                </button>
                <button
                  disabled={isFetching}
                  onClick={signInWithGoogle}
                  type="button"
                >
                  continue with Google
                </button>
              </div>
            </form>

            <p className="auth-note">
              {intent === "sign-in"
                ? "No account yet? "
                : "Already have an account? "}
              {alternate}
            </p>
          </>
        )}

        {message && !verifying ? <p>{message}</p> : null}

        {signInErrors.fields.identifier ? (
          <p className="auth-error">{signInErrors.fields.identifier.message}</p>
        ) : null}
        {signInErrors.fields.code ? (
          <p className="auth-error">{signInErrors.fields.code.message}</p>
        ) : null}
        {signUpErrors.fields.emailAddress ? (
          <p className="auth-error">{signUpErrors.fields.emailAddress.message}</p>
        ) : null}
        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

        <div id="clerk-captcha" />
      </fieldset>
    </section>
  );
}
