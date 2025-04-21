import { useEffect, useMemo } from "react";

import { useHoveredPoint } from "contexts";

export const useImagePointHighlighter = ({ size, shaderMaterial, indexToPosition }) => {
    const { highlightedPoint } = useHoveredPoint();

    const normXY = useMemo(() => {
        if (!highlightedPoint || !indexToPosition || !size) return null;

        const { index } = highlightedPoint;
        if (indexToPosition.has(index)) {
            const [x, y] = indexToPosition.get(index);

            const { width, height } = size;

            const normX = 2 * (x / width);
            const normY = 2 * (y / height);

            return { normX, normY };
        }
    }, [highlightedPoint, indexToPosition, size]);

    useEffect(() => {
        if (highlightedPoint && shaderMaterial?.uniforms?.uHighlightedIndex) {
            shaderMaterial.uniforms.uHighlightedIndex.value = highlightedPoint.index;
        } else if (shaderMaterial?.uniforms?.uHighlightedIndex) {
            shaderMaterial.uniforms.uHighlightedIndex.value = -1;
        }
    }, [highlightedPoint, shaderMaterial]);

    return normXY;
};
