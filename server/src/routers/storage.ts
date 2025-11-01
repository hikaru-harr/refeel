import crypto from "node:crypto";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { BUCKET_NAME, s3 } from "../lib/bucket.js";

const UploadBody = z.object({
  contentType: z.string().min(1),
  key: z.string().min(1).optional(),
});
const DownloadQuery = z.object({ key: z.string().min(1) });

const ListQuery = z.object({
  prefix: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  token: z.string().optional(),
  // ← 追加
  presign: z.coerce.boolean().optional(),        // 例: ?presign=1
  ttl: z.coerce.number().int().min(60).max(3600).optional(), // 例: ?ttl=300
  onlyImages: z.coerce.boolean().optional(),     // 例: ?onlyImages=0 で全て署名
});

const extFrom = (ct: string) =>
  ({
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  }[ct] ?? "bin");

const makeKey = (ext: string) =>
  `photos/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

// 画像判定（拡張子ベース）
const isImageKey = (key: string) =>
  /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(key);

// 簡易: 同時実行を制御
async function mapWithLimit<T, R>(
  arr: T[],
  limit: number,
  fn: (v: T, i: number) => Promise<R>
): Promise<R[]> {
  const ret: R[] = new Array(arr.length);
  let i = 0;
  const workers = new Array(Math.min(limit, arr.length)).fill(0).map(async () => {
    while (i < arr.length) {
      const cur = i++;
      ret[cur] = await fn(arr[cur], cur);
    }
  });
  await Promise.all(workers);
  return ret;
}

export const storage = new Hono()

  // 一覧 + オプションでプレビューURLを同梱
  .get("/", zValidator("query", ListQuery), async (c) => {
    const { prefix, limit, token, presign, ttl, onlyImages } = c.req.valid("query");

    const out = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: limit ?? 100,
      ContinuationToken: token,
      // フォルダ風にしたい場合は Delimiter: "/" を追加
    }));

    // ベースの項目
    const baseItems = (out.Contents ?? []).map((obj) => ({
      key: obj.Key!,
      size: obj.Size ?? 0,
      lastModified: obj.LastModified?.toISOString() ?? null,
    }));

    // 署名URLを付与するか
    const shouldPresign = presign === true || presign === 1 || presign === "1";
    let items = baseItems;

    if (shouldPresign && baseItems.length > 0) {
      const expiresIn = ttl ?? 300;
      const imagesOnly = onlyImages !== false; // 既定: 画像のみ署名

      // 署名対象のキーを決める
      const targets = baseItems.map((it) => ({
        ...it,
        needUrl: imagesOnly ? isImageKey(it.key) : true,
      }));

      // 同時実行 8 で presign（必要なものだけ）
      const withUrl = await mapWithLimit(targets, 8, async (it) => {
        if (!it.needUrl) return { ...it, previewUrl: null as string | null };
        const url = await getSignedUrl(
          s3,
          new GetObjectCommand({ Bucket: BUCKET_NAME, Key: it.key }),
          { expiresIn }
        );
        return { ...it, previewUrl: url as string };
      });

      items = withUrl;
    } else {
      // URLを付けない場合は previewUrl を明示的に null にしておくとフロントで扱いやすい
      items = baseItems.map((it) => ({ ...it, previewUrl: null as string | null }));
    }

    return c.json({
      items,
      nextToken: out.IsTruncated ? out.NextContinuationToken ?? null : null,
      prefix: prefix ?? null,
      limit: limit ?? 100,
      // 署名時の設定をレスポンスにも残しておくとフロントで判断しやすい
      presigned: !!shouldPresign,
      ttl: (ttl ?? 300),
      onlyImages: onlyImages !== false,
    });
  })

.post("/presign/upload", zValidator("json", UploadBody), async (c) => {
  const { contentType, key: rawKey } = c.req.valid("json");
  const key = rawKey ?? makeKey(extFrom(contentType));

  const expiresIn = 300;

  // アップロード用（PUT）
  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  );

  // プレビュー用（GET）
  const previewUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
    { expiresIn },
  );

  return c.json({ key, url, previewUrl, expiresIn });
})

  .get("/presign/download", zValidator("query", DownloadQuery), async (c) => {
    const { key } = c.req.valid("query");
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
      { expiresIn: 300 },
    );
    return c.json({ key, url, expiresIn: 300 });
  });
