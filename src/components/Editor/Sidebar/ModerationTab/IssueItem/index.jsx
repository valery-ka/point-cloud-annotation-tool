import React, { memo, useCallback, useMemo } from "react";
import { faCheck, faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

import { useEvent, useModeration, useConfig } from "contexts";

import { SidebarIcon } from "../../SidebarIcon";

// const COMPONENT_NAME = "IssueItem.";
const COMPONENT_NAME = "";

export const IssueItem = memo(({ issue, index, orderNumber }) => {
    const { t } = useTranslation();

    const { publish } = useEvent();
    const { isModerationJob } = useConfig();
    const { isIssuesHidden } = useModeration();

    const isIssueActive = useMemo(() => {
        return issue.resolved || isIssuesHidden || issue.checked;
    }, [issue, isIssuesHidden]);

    const switchCameraToIssue = useCallback(() => {
        if (issue.resolved || isIssuesHidden || issue.checked) return;
        publish("switchCameraToIssue", issue.position);
    }, [publish, isIssueActive]);

    return (
        <div
            className={`issue-item ${isIssueActive ? "resolved" : ""}`}
            key={index}
            onClick={() => switchCameraToIssue(issue)}
        >
            <div className="issue">{orderNumber}</div>
            <div className="issue-text-container">
                <div className="issue-text">{issue.workerHint}</div>
            </div>
            {isModerationJob ? (
                <>
                    <SidebarIcon
                        className="icon-style"
                        title={issue.resolved ? t("unresolveIssue") : t("resolveIssue")}
                        action={"resolveIssue"}
                        type={"resolveIssue"}
                        index={index}
                        icon={issue.resolved ? faTimes : faCheck}
                    />
                    <SidebarIcon
                        className="icon-style"
                        title={t("removeIssue")}
                        action={"removeIssue"}
                        type={"removeIssue"}
                        index={index}
                        icon={faTrash}
                    />
                </>
            ) : (
                <>
                    <SidebarIcon
                        className="icon-style"
                        title={issue.checked ? t("uncheckIssue") : t("checkIssue")}
                        action={"checkIssue"}
                        type={"checkIssue"}
                        index={index}
                        icon={issue.checked ? faTimes : faCheck}
                    />
                </>
            )}
        </div>
    );
});
