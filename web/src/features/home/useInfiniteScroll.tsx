import { useEffect, useRef } from "react";
import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { fetchPhotos } from "@/api/photos";
import type { ListPhotosResponse } from "@refeel/shared/photo.js";

/**
 * カーソル（次ページ取得のためのポインタ）。
 * - 初回は undefined（＝最初のページ）
 * - 以降は API が返す nextCursor を渡す
 */
type Cursor = string | undefined;

/**
 * スクロール末尾に到達したら自動で次ページを読み込むためのカスタムフック。
 *
 * 使い方:
 * const { sentinelRef, fetchPhotoQuery } = useInfiniteScroll();
 * <div>...一覧...</div>
 * <div ref={sentinelRef} /> ← この要素が画面に入ると次ページを読み込む
 */
const useInfiniteScroll = () => {
    // 監視対象となるダミー要素（“番兵”）の参照
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    /**
     * TanStack Query v5 の無限スクロール用フック。
     * - queryKey：キャッシュキー。group と take をキーに含めることで条件が変われば別キャッシュになる
     * - queryFn：pageParam（= cursor）を受け取り、次ページをフェッチ
     * - initialPageParam：v5 では必須。初回は undefined で OK
     * - getNextPageParam：レスポンスから次ページのカーソルを返す（なければ undefined）
     * - staleTime：同一キーのデータを 30 秒間は “新鮮” とみなす（再フェッチ抑制）
     */
    const fetchPhotoQuery = useInfiniteQuery<
        ListPhotosResponse, // data 型（各ページの型）
        Error,              // error 型
        InfiniteData<ListPhotosResponse>, // select 後の型（今回はそのまま）
        readonly [string, { group: "ym" | "ymd"; take: number }], // queryKey の型
        Cursor              // pageParam（= cursor）の型
    >({
        queryKey: ["photos", { group: "ym", take: 50 }],
        queryFn: ({ pageParam }) =>
            fetchPhotos({ group: "ym", take: 50, cursor: pageParam }),
        initialPageParam: undefined, // 初回はカーソルなしでスタート
        getNextPageParam: (last) => last.nextCursor ?? undefined,
        staleTime: 30_000,
    });

    /**
     * IntersectionObserver を使って “番兵” 要素の可視状態を監視。
     * - 可視になったら hasNextPage と isFetchingNextPage を確認して fetchNextPage()
     * - 監視開始/解除のライフサイクルを正しく管理（クリーンアップで disconnect）
     *
     * 依存配列には、監視条件に関わるフラグと fetchNextPage を入れる。
     * ※ fetchNextPage は安定参照だが型的にも依存に入れておくと安全。
     */
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;

        const io = new IntersectionObserver((entries) => {
            const [entry] = entries;
            const shouldLoad =
                entry.isIntersecting &&
                fetchPhotoQuery.hasNextPage &&
                !fetchPhotoQuery.isFetchingNextPage;

            if (shouldLoad) {
                fetchPhotoQuery.fetchNextPage();
            }
        });

        io.observe(el);
        return () => io.disconnect();
        // 依存：次ページの有無/読み込み中か/読み込み関数
    }, [
        fetchPhotoQuery.hasNextPage,
        fetchPhotoQuery.isFetchingNextPage,
        fetchPhotoQuery.fetchNextPage,
    ]);

    // コンポーネント側で番兵を配置し、クエリ結果を参照できるよう返す
    return { sentinelRef, fetchPhotoQuery };
};

export default useInfiniteScroll;
