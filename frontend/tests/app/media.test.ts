import { describe, it, expect, vi, beforeEach } from "vitest";

const { sendMock, FakeNoSuchKey } = vi.hoisted(() => {
  class FakeNoSuchKey extends Error {}
  return { sendMock: vi.fn(), FakeNoSuchKey };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function S3Client(this: { send: typeof sendMock }) {
    this.send = sendMock;
  }),
  GetObjectCommand: vi.fn(function GetObjectCommand(this: Record<string, unknown>, input: object) {
    Object.assign(this, input);
  }),
  NoSuchKey: FakeNoSuchKey,
}));

import { GET } from "@/app/media/[...key]/route";

function makeParams(key: string[]): { params: Promise<{ key: string[] }> } {
  return { params: Promise.resolve({ key }) };
}

function streamOf(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

describe("GET /media/[...key]", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("オブジェクトを取得し、Content-Typeとキャッシュヘッダ付きで返す", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    sendMock.mockResolvedValue({
      ContentType: "image/jpeg",
      Body: { transformToWebStream: vi.fn(() => streamOf(bytes)) },
    });

    const res = await GET(new Request("http://localhost/media/products/1/a.jpg"), {
      ...makeParams(["products", "1", "a.jpg"]),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(bytes);
  });

  it("存在しないキーは404になる", async () => {
    sendMock.mockRejectedValue(new FakeNoSuchKey("not found"));

    const res = await GET(new Request("http://localhost/media/none.jpg"), {
      ...makeParams(["none.jpg"]),
    });

    expect(res.status).toBe(404);
  });

  it("キーを/で結合してBucket/Keyを指定する", async () => {
    sendMock.mockResolvedValue({
      ContentType: "image/jpeg",
      Body: { transformToWebStream: vi.fn(() => streamOf(new Uint8Array())) },
    });

    await GET(new Request("http://localhost/media/products/1/a.jpg"), {
      ...makeParams(["products", "1", "a.jpg"]),
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ Key: "products/1/a.jpg" }),
    );
  });
});
