import React from "react";

import { useFrames, useModeration } from "contexts";

import { SceneButton } from "../SceneButton";

export const ModerationComments = () => {
    const { issues, isIssuesHidden } = useModeration();
    const { activeFrameIndex } = useFrames();

    if (!issues.length || isIssuesHidden) return;

    return (
        <>
            {issues.reduce((acc, issue, index) => {
                if (issue.frame === activeFrameIndex) {
                    acc.push(
                        <SceneButton
                            key={index}
                            index={index}
                            buttonIndex={acc.length + 1}
                            position={issue.position}
                            resolved={issue.resolved}
                            workerHint={issue.workerHint}
                        />,
                    );
                }
                return acc;
            }, [])}
        </>
    );
};
