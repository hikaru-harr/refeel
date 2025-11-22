import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { favOff, favOn } from "@/api/photos";
import { useCommentActions } from "./useComments";
import type { PhotoItemType } from "@refeel/shared/photo.js";


const usePhotoActgions = () => {
    const qc = useQueryClient();
    const { createComment } = useCommentActions();

    // 写真ごとの入力テキスト（複数ダイアログをまたいでも保持）
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
        {},
    );

    const toggleFav = useMutation({
        mutationFn: async (file: PhotoItemType) =>
            file.isFavorited ? favOff(file.id) : favOn(file.id),
        onMutate: async (file) => {
            const qk = ["photos"];
            const prev = qc.getQueryData<any>(qk);
            qc.setQueryData(qk, (old: any) => {
                if (!old) return old;
                const draft = structuredClone(old);
                for (const page of draft.pages ?? []) {
                    const grouped: Record<string, PhotoItemType[]> = page.grouped;
                    for (const key of Object.keys(grouped ?? {})) {
                        grouped[key] = grouped[key].map((it) =>
                            it.id === file.id
                                ? {
                                    ...it,
                                    isFavorited: !it.isFavorited,
                                    favoriteCount: Math.max(
                                        0,
                                        (it.favoriteCount ?? 0) + (it.isFavorited ? -1 : 1),
                                    ),
                                }
                                : it,
                        );
                    }
                }
                return draft;
            });
            return { prev, qk };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.prev && ctx.qk) qc.setQueryData(ctx.qk, ctx.prev);
        },
        onSettled: () => qc.invalidateQueries({ queryKey: ["photos"] }),
    });

    const setInput = useCallback((photoId: string, v: string) => {
        setCommentInputs((m) => ({ ...m, [photoId]: v }));
    }, []);

    const sendComment = useCallback(
        (photoId: string) => {
            const body = (commentInputs[photoId] ?? "").trim();
            if (!body) return;
            createComment.mutate({ photoId, body });
            setInput(photoId, "");
        },
        [commentInputs, createComment, setInput],
    );

    // 入力値getter/setter（余計な再レンダを避けるため useCallback）
    const getInput = useCallback(
        (photoId: string) => commentInputs[photoId] ?? "",
        [commentInputs],
    );
    return ({
        toggleFav,
        getInput,
        sendComment,
        setInput
    })
}

export default usePhotoActgions