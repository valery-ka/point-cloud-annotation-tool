import { useCallback } from "react";
import { useEvent, useFrames, useModeration } from "contexts";

import { SceneButton } from "../SceneButton";

import { TABS } from "constants";

export const ModerationComments = () => {
    const { issues, isIssuesHidden } = useModeration();
    const { activeFrameIndex } = useFrames();
    const { publish } = useEvent();

    const setActiveTab = useCallback(() => {
        publish("setActiveTab", TABS.MODERATION);
    }, [publish]);

    if (!issues.length || isIssuesHidden) return;

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
                            hidden={issue.resolved || issue.checked}
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
};
