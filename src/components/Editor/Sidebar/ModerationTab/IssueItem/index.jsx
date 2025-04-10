import React, { memo, useCallback } from "react";
import { faCheck, faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

import { useEvent, useModeration } from "@contexts";

import { SidebarIcon } from "../../SidebarIcon";

// const COMPONENT_NAME = "IssueItem.";
const COMPONENT_NAME = "";

export const IssueItem = memo(({ issue, index, orderNumber }) => {
    const { t } = useTranslation();

    const { publish } = useEvent();
    const { isIssuesHidden } = useModeration();

    const switchCameraToIssue = useCallback(() => {
        publish("switchCameraToIssue", issue.position);
    }, [publish]);

    return (
        <div
            className={`issue-item ${issue.resolved || isIssuesHidden ? "resolved" : ""}`}
            key={index}
            onClick={() => switchCameraToIssue(issue)}
        >
            <div className="issue">{orderNumber}</div>
            <div className="issue-text-container">
                <div className="issue-text">{issue.workerHint}</div>
            </div>
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
        </div>
    );
});
