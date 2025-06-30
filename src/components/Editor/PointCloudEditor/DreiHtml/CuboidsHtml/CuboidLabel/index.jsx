import { memo } from "react";

export const CuboidLabel = memo(({ label, showLabel, onLabelClick }) => {
    return (
        <>
            {showLabel && (
                <button
                    className="scene-button"
                    onClick={onLabelClick}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {label}
                </button>
            )}
        </>
    );
});
