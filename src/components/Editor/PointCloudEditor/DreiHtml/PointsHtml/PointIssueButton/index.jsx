import { memo, useState } from "react";

import { SceneButton } from "../../SceneButton";
import { IssueSceneInfo } from "../../IssueSceneInfo";

export const PointIssueButton = memo(
    ({ index, text, position, hint, hiddenIssue, onClick, publish, isModerationJob }) => {
        const [showHint, setShowHint] = useState(false);

        if (hiddenIssue) return;

        return (
            <SceneButton position={position} setShowTooltip={setShowHint}>
                <button
                    className="scene-button"
                    onClick={onClick}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {text}
                </button>
                {showHint && (
                    <IssueSceneInfo
                        hint={hint}
                        index={index}
                        publish={publish}
                        setShowHint={setShowHint}
                        isModerationJob={isModerationJob}
                    />
                )}
            </SceneButton>
        );
    },
);
