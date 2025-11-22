// src/features/photos/VirtualPhotoGrid.tsx
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List, type ListChildComponentProps } from 'react-window';
import { memo } from 'react';
import type { PhotoItemType } from '@refeel/shared/photo.js';

type Props = {
    files: PhotoItemType[];
    onOpen: (id: string) => void;
    prefetch: (id: string, url?: string | null) => void;
};

type ItemData = {
    files: PhotoItemType[];
    cols: number;
    cell: number;
    gap: number;
    onOpen: (id: string) => void;
    prefetch: (id: string, url?: string | null) => void;
};

// Row は通常の関数（フック不使用）にしておく
function Row({ index, style, data }: ListChildComponentProps) {
    const { files, cols, cell, gap, onOpen, prefetch } = data as ItemData;
    const start = index * cols;
    const rowItems = files.slice(start, start + cols);

    return (
        <div style={style} className="flex">
            {rowItems.map((file, i) => (
                <button
                    key={file.id}
                    type="button"
                    style={{ width: cell, height: cell, marginRight: i < cols - 1 ? gap : 0 }}
                    className="bg-neutral-200 overflow-hidden"
                    onPointerDown={() => onOpen(file.id)}
                    onPointerEnter={() => prefetch(file.id, file.previewUrl)}
                    onTouchStart={() => prefetch(file.id, file.previewUrl)}
                    aria-label="写真を拡大"
                >
                    <img
                        src={file.previewUrl ?? ''}
                        alt={file.objectKey}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                    />
                </button>
            ))}
        </div>
    );
}

export const VirtualPhotoGrid = memo(function VirtualPhotoGrid({ files, onOpen, prefetch }: Props) {
    const gap = 4; // px

    return (
        <div className="mt-4" style={{ height: 'calc(100vh - 140px)' }}>
            <AutoSizer>
                {({ height, width }) => {
                    // ここはただの計算（フックは使わない）
                    const cols = width >= 1024 ? 5 : width >= 768 ? 4 : 3;
                    const cell = Math.floor((width - gap * (cols - 1)) / cols);
                    const rowCount = Math.ceil(files.length / cols);

                    const itemData: ItemData = { files, cols, cell, gap, onOpen, prefetch };

                    return (
                        <List
                            height={height}
                            width={width}
                            itemSize={cell + gap}
                            itemCount={rowCount}
                            itemData={itemData}
                            overscanCount={3}
                        >
                            {Row}
                        </List>
                    );
                }}
            </AutoSizer>
        </div>
    );
});
