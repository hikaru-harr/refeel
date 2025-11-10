import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET_NAME, s3 } from "../lib/bucket.js";

export const extFrom = (ct: string) =>
    ({
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/heic": "heic",
        "image/heif": "heif",
    })[ct] ?? "bin";

export const makeKey = (ext: string) =>
    `photos/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

// 画像判定（拡張子ベース）
export const isImageKey = (key: string) =>
    /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(key);

// 簡易: 同時実行を制御
export async function mapWithLimit<T, R>(
    arr: T[],
    limit: number,
    fn: (v: T, i: number) => Promise<R>,
): Promise<R[]> {
    const ret: R[] = new Array(arr.length);
    let i = 0;
    const workers = new Array(Math.min(limit, arr.length))
        .fill(0)
        .map(async () => {
            while (i < arr.length) {
                const cur = i++;
                ret[cur] = await fn(arr[cur], cur);
            }
        });
    await Promise.all(workers);
    return ret;
}

// 追加: S3上の存在確認（HEAD）ヘルパ
export async function ensureObjectExists(key: string) {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
}

// 追加: AIワーカーへの投入ダミー（実装はお好みのキューで差し替えてOK）
export async function enqueueAIJob(input: {
    photoId: string;
    key: string;
    mime: string;
    bytes: number;
    sha256?: string;
}) {
    // TODO: BullMQ / RabbitMQ / Cloud Tasks / 自前ワーカーへ投げる
    // いまはログだけ（MVP）
    console.log("[AI-QUEUE] enqueue", input);
}
