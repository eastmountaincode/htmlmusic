import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

let cachedClient: S3Client | null = null;

function getR2Config(): R2Config {
  const accountId = (
    process.env.R2_ACCOUNT_ID ?? process.env.CLOUDFLARE_ACCOUNT_ID
  )?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("R2 configuration is incomplete.");
  }

  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function getR2Client() {
  if (cachedClient) return cachedClient;

  const config = getR2Config();
  cachedClient = new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    region: "auto",
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  return cachedClient;
}

function inlineContentDisposition(filename: string) {
  const asciiFilename = filename
    .replace(/[^\x20-\x7e]/g, "_")
    .replace(/["\\]/g, "_");

  return `inline; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(
    filename,
  )}`;
}

export async function createR2UploadUrl(key: string, contentType: string) {
  const { bucket } = getR2Config();

  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: bucket,
      ContentType: contentType,
      Key: key,
    }),
    { expiresIn: 10 * 60 },
  );
}

export async function createR2DownloadUrl(
  key: string,
  contentType: string,
  filename: string,
) {
  const { bucket } = getR2Config();

  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: inlineContentDisposition(filename),
      ResponseContentType: contentType,
    }),
    { expiresIn: 60 * 60 },
  );
}

export async function headR2Object(key: string) {
  const { bucket } = getR2Config();
  const response = await getR2Client().send(
    new HeadObjectCommand({ Bucket: bucket, Key: key }),
  );

  return {
    contentLength: response.ContentLength ?? null,
    contentType: response.ContentType ?? null,
  };
}

export async function deleteR2Objects(keys: string[]) {
  const { bucket } = getR2Config();

  await Promise.all(
    keys.map((key) =>
      getR2Client().send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      ),
    ),
  );
}
