import { useEffect, useRef, useState, memo } from "react";

export const SVGText = memo(({ text = "", x = 5, y = 6 }) => {
    const textRef = useRef(null);
    const [bbox, setBBox] = useState({ width: -1000, height: -1000 });

    const paddingX = 8;
    const paddingY = 4;

    const planeWidth = bbox.width + paddingX;
    const planeHeight = bbox.height + paddingY;

    const borderRadius = 5;

    useEffect(() => {
        if (textRef.current) {
            const { width, height } = textRef.current.getBBox();
            setBBox({
                width: Math.max(width + paddingX, 40),
                height: Math.max(height + paddingY, 20),
            });
        }
    }, [text]);

    return (
        <svg width={200} height={100}>
            <rect
                className="svg-rect"
                x={x}
                y={y}
                width={planeWidth}
                height={planeHeight}
                rx={borderRadius}
                ry={borderRadius}
            />
            <text
                className="svg-text"
                ref={textRef}
                x={x + planeWidth / 2}
                y={y + planeHeight / 2 + 1}
                textAnchor="middle"
                alignmentBaseline="middle"
            >
                {text}
            </text>
        </svg>
    );
});
