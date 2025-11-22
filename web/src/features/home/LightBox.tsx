// src/features/photos/Lightbox.tsx
import { useEffect } from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
};

export function Lightbox({ open, onClose, children }: Props) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);

        const prev = document.documentElement.style.overflow;
        document.documentElement.style.overflow = "hidden"; // スクロールロックのみ
        return () => {
            document.documentElement.style.overflow = prev;
            document.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] select-none"
            onClick={onClose}
            style={{ background: "rgba(0,0,0,.5)" }}
        >
            <div
                className="absolute inset-0 grid place-items-center"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
