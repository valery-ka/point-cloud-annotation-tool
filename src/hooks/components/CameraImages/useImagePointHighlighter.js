import { useEffect, useMemo } from "react";

import { useHoveredPoint } from "contexts";

export const useImagePointHighlighter = ({ size, shaderMaterial, positions }) => {
    const { highlightedPoint } = useHoveredPoint();

    const normXY = useMemo(() => {
        if (!highlightedPoint || !positions || !size) return null;

        const { index } = highlightedPoint;
        if (positions.has(index)) {
            const [x, y] = positions.get(index);

            const { width, height } = size;

            const normX = 2 * (x / width);
            const normY = 2 * (y / height);

            return { normX, normY };
        }
    }, [highlightedPoint, positions, size]);

    useEffect(() => {
        if (highlightedPoint && shaderMaterial?.uniforms?.uHighlightedIndex) {
            shaderMaterial.uniforms.uHighlightedIndex.value = highlightedPoint.index;
        } else if (shaderMaterial?.uniforms?.uHighlightedIndex) {
            shaderMaterial.uniforms.uHighlightedIndex.value = -1;
        }
    }, [highlightedPoint, shaderMaterial]);

    return normXY;
};
