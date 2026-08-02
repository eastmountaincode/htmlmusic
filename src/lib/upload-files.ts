export const MAX_AUDIO_FILE_SIZE = 30 * 1024 * 1024;
export const MAX_ARTWORK_FILE_SIZE = 20 * 1024 * 1024;
export const MAX_RECORDING_DURATION_SECONDS = 24 * 60 * 60;
export const MAX_FILENAME_LENGTH = 255;

const audioTypesByExtension: Record<string, string> = {
  aif: "audio/aiff",
  aiff: "audio/aiff",
  flac: "audio/flac",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  oga: "audio/ogg",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  wav: "audio/wav",
};

const artworkTypesByExtension: Record<string, string> = {
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const controlCharacters = /[\u0000-\u001f\u007f]/;

export type UploadFileDescription = {
  name: string;
  size: number;
  type: string;
};

function getExtension(filename: string) {
  const extension = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return extension ?? "";
}

function validateFilename(filename: string) {
  return (
    filename.length > 0 &&
    filename.length <= MAX_FILENAME_LENGTH &&
    !controlCharacters.test(filename)
  );
}

export function validateAudioFile(file: UploadFileDescription) {
  const extension = getExtension(file.name);
  const contentType = audioTypesByExtension[extension];

  if (!validateFilename(file.name) || !contentType) return null;
  if (!Number.isInteger(file.size) || file.size < 1 || file.size > MAX_AUDIO_FILE_SIZE) {
    return null;
  }
  if (file.type && file.type !== "application/octet-stream" && !file.type.startsWith("audio/")) {
    return null;
  }

  return { contentType, extension };
}

export function validateArtworkFile(file: UploadFileDescription) {
  const extension = getExtension(file.name);
  const contentType = artworkTypesByExtension[extension];

  if (!validateFilename(file.name) || !contentType) return null;
  if (
    !Number.isInteger(file.size) ||
    file.size < 1 ||
    file.size > MAX_ARTWORK_FILE_SIZE
  ) {
    return null;
  }
  if (file.type && file.type !== contentType) return null;

  return { contentType, extension };
}
