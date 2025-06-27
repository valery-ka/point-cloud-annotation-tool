import { useState, useEffect, useCallback, memo } from "react";
import { useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { useEvent, useConfig } from "contexts";

import { IssueSceneInfo } from "../ModerationComments/IssueSceneInfo";

export const SceneButton = memo(
    ({
        index,
        position,
        text,
        hidden,
        hint,
        hover,
        onClick,
        isCuboid = false,
        onCuboidIssueClick,
        onAddIssueClick,
        cuboidHasIssue,
        cuboidIssueHidden,
        issueId,
    }) => {
        const { gl } = useThree();
        const { domElement } = gl;

        const { publish } = useEvent();
        const { isModerationJob } = useConfig();

        const [isMouseDown, setIsMouseDown] = useState(false);
        const [showPointHint, setShowPointHint] = useState(false);
        const [showCuboidHint, setShowCuboidHint] = useState(false);

        useEffect(() => {
            const handleMouseDown = () => setIsMouseDown(true);
            const handleMouseUp = () => setIsMouseDown(false);

            domElement.addEventListener("mousedown", handleMouseDown);
            domElement.addEventListener("mouseup", handleMouseUp);

            return () => {
                domElement.removeEventListener("mousedown", handleMouseDown);
                domElement.removeEventListener("mouseup", handleMouseUp);
            };
        }, []);

        const handleWheel = useCallback((event) => {
            event.stopPropagation();
            domElement.dispatchEvent(new WheelEvent("wheel", event));
        }, []);

        return (
            <Html position={position} zIndexRange={[10, 10]}>
                {!hidden && (
                    <div
                        className="scene-button-wrapper"
                        onMouseEnter={() => setShowPointHint(true)}
                        onMouseLeave={() => setShowPointHint(false)}
                        onWheel={handleWheel}
                    >
                        <button
                            className="scene-button"
                            onClick={(e) => onClick(e)}
                            onMouseDown={(e) => e.preventDefault()}
                            style={{ pointerEvents: isMouseDown ? "none" : "auto" }}
                        >
                            {text}
                        </button>

                        {hover && showPointHint && (
                            <IssueSceneInfo
                                hint={hint}
                                index={index}
                                publish={publish}
                                setShowHint={setShowPointHint}
                                isModerationJob={isModerationJob}
                            />
                        )}
                    </div>
                )}

                {isCuboid && isModerationJob && !cuboidHasIssue && !hidden && (
                    <div className="scene-button-wrapper" onWheel={handleWheel}>
                        <button
                            className="scene-button"
                            onClick={(e) => onAddIssueClick(e)}
                            onMouseDown={(e) => e.preventDefault()}
                            style={{ pointerEvents: isMouseDown ? "none" : "auto" }}
                        >
                            {"🤬"}
                        </button>
                    </div>
                )}

                {isCuboid && cuboidHasIssue && cuboidIssueHidden && (
                    <div
                        className="scene-button-wrapper"
                        onMouseEnter={() => setShowCuboidHint(true)}
                        onMouseLeave={() => setShowCuboidHint(false)}
                        onWheel={handleWheel}
                    >
                        <button
                            className="scene-button"
                            onClick={(e) => onCuboidIssueClick(e)}
                            onMouseDown={(e) => e.preventDefault()}
                            style={{ pointerEvents: isMouseDown ? "none" : "auto" }}
                        >
                            {index}
                        </button>

                        {showCuboidHint && (
                            <IssueSceneInfo
                                hint={hint}
                                index={issueId}
                                publish={publish}
                                setShowHint={setShowCuboidHint}
                                isModerationJob={isModerationJob}
                            />
                        )}
                    </div>
                )}
            </Html>
        );
    },
);
