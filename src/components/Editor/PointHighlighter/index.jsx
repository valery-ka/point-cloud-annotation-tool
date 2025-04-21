import { useHoveredPoint, useImages } from "contexts";

import { PointHighlighterCanvas } from "./PointHighlighterCanvas";

const CROP_SIZE = 200;

export const PointHighlighter = () => {
    const { highlightedPoint } = useHoveredPoint();
    const { loadedImages, selectedImagePath } = useImages();

    return (
        <div
            className={`point-highlighter-wrapper ${!highlightedPoint ? "hidden" : ""}`}
            style={{
                width: `${CROP_SIZE}px`,
                height: `${CROP_SIZE}px`,
            }}
        >
            <div className="vignette"></div>
            <div className="point-highlighter-image">
                <PointHighlighterCanvas image={loadedImages[selectedImagePath]} />
            </div>
        </div>
    );
};
