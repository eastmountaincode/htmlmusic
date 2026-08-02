export const DEFAULT_ACCOUNT_PATH = "/account";

export function getAccountReturnPath(
  value: string | string[] | null | undefined,
) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return DEFAULT_ACCOUNT_PATH;

  try {
    const url = candidate.startsWith("/") && !candidate.startsWith("//")
      ? new URL(candidate, "https://html-music.invalid")
      : new URL(candidate);

    if (url.pathname !== DEFAULT_ACCOUNT_PATH) {
      return DEFAULT_ACCOUNT_PATH;
    }

    return url.searchParams.get("tab") === "tracks"
      ? "/account?tab=tracks"
      : DEFAULT_ACCOUNT_PATH;
  } catch {
    return DEFAULT_ACCOUNT_PATH;
  }
}

export function getAuthPath(pathname: string, returnTo: string) {
  if (returnTo === DEFAULT_ACCOUNT_PATH) return pathname;
  return `${pathname}?redirect_url=${encodeURIComponent(returnTo)}`;
}
