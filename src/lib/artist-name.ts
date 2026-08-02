export const ARTIST_NAME_MAX_LENGTH = 80;

type ArtistNameUser = {
  publicMetadata: UserPublicMetadata;
  fullName?: string | null;
  username?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
};

export function getArtistName(user: ArtistNameUser) {
  const savedName = user.publicMetadata.artistName;

  if (typeof savedName === "string" && savedName.trim()) {
    return savedName.trim();
  }

  return (
    user.fullName?.trim() ||
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress ||
    "member"
  );
}
