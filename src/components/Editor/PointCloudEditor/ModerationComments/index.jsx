import { memo, useCallback } from "react";
import { useEvent, useFrames, useModeration } from "contexts";

import { SceneButton } from "../SceneButton";

import { TABS } from "constants";

export const ModerationComments = memo(() => {
    const { issues, isIssuesHidden } = useModeration();
    const { activeFrameIndex } = useFrames();
    const { publish } = useEvent();

    const setActiveTab = useCallback(() => {
        publish("setActiveTab", TABS.MODERATION);
    }, [publish]);

    const getIsHidden = useCallback(
        (issue) => {
            return issue.resolved || issue.checked || issue.source === "object" || isIssuesHidden;
        },
        [isIssuesHidden],
    );

    if (!issues.length) return;

    return (
        <>
            {issues.reduce((acc, issue, index) => {
                if (issue.frame === activeFrameIndex) {
                    acc.push(
                        <SceneButton
                            key={index}
                            index={index}
                            text={acc.length + 1}
                            position={issue.position}
                            hidden={getIsHidden(issue)}
                            hint={issue.workerHint}
                            hover={true}
                            onClick={setActiveTab}
                        />,
                    );
                }
                return acc;
            }, [])}
        </>
    );
});
