// バケット（ローカルはRustFS）の画像配信プロキシ（docs/backend/storage-layout.md）。
// product_images.path等が組み立てる/media/{path}はこのルートが受ける。

import { GetObjectCommand, NoSuchKey, S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({
  endpoint: process.env.BUCKET_ENDPOINT,
  region: process.env.BUCKET_REGION,
  forcePathStyle: process.env.BUCKET_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId: process.env.BUCKET_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY ?? "",
  },
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
): Promise<Response> {
  const { key } = await params;

  try {
    const object = await client.send(
      new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: key.join("/") }),
    );

    const body = object.Body?.transformToWebStream();
    if (!body) return new Response(null, { status: 404 });

    return new Response(body, {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error instanceof NoSuchKey) return new Response(null, { status: 404 });
    throw error;
  }
}
