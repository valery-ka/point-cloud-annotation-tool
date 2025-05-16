import { useSideViews } from "contexts";

import { projectToScreen } from "utils/cuboids";

export const SideViewSVG = ({ name, y, width, height, mesh, camera }) => {
    const { handlePositions } = useSideViews();

    const handles = handlePositions?.[name] ?? [];

    return (
        <svg
            width={width}
            height={height}
            style={{
                position: "absolute",
                left: 0,
                top: y,
                pointerEvents: "none",
            }}
        >
            <text x="10" y="20" fill="white" fontSize="14">
                {name}
            </text>
            {mesh &&
                camera &&
                handles.map((pos3d, i) => {
                    const pos2d = projectToScreen(pos3d, camera, width, height);
                    return (
                        <circle
                            key={i}
                            cx={pos2d.x}
                            cy={pos2d.y}
                            r="10"
                            fill="white"
                            fillOpacity="0.5"
                        />
                    );
                })}
        </svg>
    );
};
