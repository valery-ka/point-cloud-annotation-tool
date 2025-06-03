import { useEffect, useRef, useState, memo } from "react";

import { getSVGPosition } from "utils/shared";

export const SVGText = memo(
    ({ text = "", x = 5, y = 6, position = "top-left", parentWidth = 0, parentHeight = 0 }) => {
        const textRef = useRef(null);
        const [bbox, setBBox] = useState({ width: 0, height: 0 });
        const [isMeasured, setIsMeasured] = useState(false);

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
                setIsMeasured(true);
            }
        }, [text]);

        const { x: posX, y: posY } = getSVGPosition(
            x,
            y,
            position,
            parentWidth,
            parentHeight,
            planeWidth,
            planeHeight,
        );

        return (
            <svg visibility={isMeasured ? "" : "hidden"}>
                <rect
                    className="svg-rect"
                    x={posX}
                    y={posY}
                    width={planeWidth}
                    height={planeHeight}
                    rx={borderRadius}
                    ry={borderRadius}
                />
                <text
                    className="svg-text"
                    ref={textRef}
                    x={posX + planeWidth / 2}
                    y={posY + planeHeight / 2 + 1}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                >
                    {text}
                </text>
            </svg>
        );
    },
);
