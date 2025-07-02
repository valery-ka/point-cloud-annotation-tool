import { memo, useCallback } from "react";
import { useEvent, useFrames, useModeration, useConfig } from "contexts";

import { PointIssueButton } from "./PointIssueButton";

import { TABS } from "constants";

export const PointsHtml = memo(() => {
    const { publish } = useEvent();
    const { isModerationJob } = useConfig();
    const { issues, isIssueHidden } = useModeration();

    const { activeFrameIndex } = useFrames();

    const getIsHidden = useCallback(
        (issue) => {
            return issue.source === "object" || isIssueHidden(issue);
        },
        [isIssueHidden, isModerationJob],
    );

    const setActiveTab = useCallback(() => {
        publish("setActiveTab", TABS.MODERATION);
    }, [publish]);

    if (!issues.length) return;

    return (
        <>
            {issues.reduce((acc, issue, index) => {
                if (issue.frame === activeFrameIndex) {
                    acc.push(
                        <PointIssueButton
                            key={index}
                            index={index}
                            text={acc.length + 1}
                            position={issue.position}
                            hiddenIssue={getIsHidden(issue)}
                            hint={issue.workerHint}
                            onClick={setActiveTab}
                            publish={publish}
                            isModerationJob={isModerationJob}
                        />,
                    );
                }
                return acc;
            }, [])}
        </>
    );
});
