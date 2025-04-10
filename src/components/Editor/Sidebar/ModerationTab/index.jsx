import React, { memo, useMemo, useCallback } from "react";
import {
    faCheckDouble,
    faEye,
    faEyeSlash,
    faAngleDoubleLeft,
    faAngleDoubleRight,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

import { useModeration, useFrames } from "@contexts";
import { useSubscribeFunction } from "@hooks";

import { IssueItem } from "./IssueItem";
import { SidebarIcon } from "../SidebarIcon";

export const ModerationTab = memo(({ title }) => {
    const { t } = useTranslation();
    const { issues, setIssues, isIssuesHidden, setIsIssuesHidden } = useModeration();
    const { activeFrameIndex, setActiveFrameIndex } = useFrames();

    const framesWithIssues = useMemo(() => {
        const uniqueFrames = new Set(issues.map((issue) => issue.frame));
        return Array.from(uniqueFrames).sort((a, b) => a - b);
    }, [issues]);

    const { isPrevButtonActive, isNextButtonActive } = useMemo(() => {
        const firstIssueFrame = framesWithIssues.length > 0 ? framesWithIssues[0] : null;
        const lastIssueFrame =
            framesWithIssues.length > 0 ? framesWithIssues[framesWithIssues.length - 1] : null;

        return {
            isPrevButtonActive: activeFrameIndex > firstIssueFrame,
            isNextButtonActive: activeFrameIndex < lastIssueFrame,
        };
    }, [framesWithIssues, activeFrameIndex]);

    const frameHasIssues = useMemo(() => {
        return issues.some(
            ({ resolved, frame }) => resolved === false && activeFrameIndex === frame,
        );
    }, [activeFrameIndex, issues]);

    const removeIssue = useCallback((data) => {
        const issueIndex = data.index;
        setIssues((prevIssues) => prevIssues.filter((_, index) => index !== issueIndex));
    }, []);

    useSubscribeFunction("removeIssue", removeIssue, []);

    const resolveIssue = useCallback((data) => {
        const issueIndex = data.index;
        setIssues((prevIssues) =>
            prevIssues.map((issue, index) =>
                index === issueIndex ? { ...issue, resolved: !issue.resolved } : issue,
            ),
        );
    }, []);

    useSubscribeFunction("resolveIssue", resolveIssue, []);

    const markAllAsResolved = useCallback(() => {
        setIssues((prevIssues) =>
            prevIssues.map((issue) =>
                issue.frame === activeFrameIndex && issue.resolved === false
                    ? { ...issue, resolved: true }
                    : issue,
            ),
        );
    }, [activeFrameIndex]);

    useSubscribeFunction("markAllAsResolved", markAllAsResolved, []);

    const hideIssues = useCallback(() => {
        setIsIssuesHidden((prev) => !prev);
    }, []);

    useSubscribeFunction("hideIssues", hideIssues, []);

    const nextModerationFrame = useCallback(() => {
        let nextFrame = null;
        for (let i = 0; i < framesWithIssues.length; i++) {
            if (framesWithIssues[i] > activeFrameIndex) {
                nextFrame = framesWithIssues[i];
                break;
            }
        }
        if (nextFrame !== null) {
            setActiveFrameIndex(nextFrame);
        }
    }, [activeFrameIndex, framesWithIssues]);

    useSubscribeFunction("nextModerationFrame", nextModerationFrame, []);

    const prevModerationFrame = useCallback(() => {
        let prevFrame = null;
        for (let i = framesWithIssues.length - 1; i >= 0; i--) {
            if (framesWithIssues[i] < activeFrameIndex) {
                prevFrame = framesWithIssues[i];
                break;
            }
        }
        if (prevFrame !== null) {
            setActiveFrameIndex(prevFrame);
        }
    }, [activeFrameIndex, framesWithIssues]);

    useSubscribeFunction("prevModerationFrame", prevModerationFrame, []);

    return (
        <div className="sidebar-tab-panel">
            <div className="tab-header-container">
                <h2 className="tab-header">{title}</h2>
                <div className="tab-header-buttons">
                    <SidebarIcon
                        className={`icon-style ${isPrevButtonActive ? "" : "disabled"}`}
                        size="20px"
                        title={t("prevModerationFrame")}
                        icon={faAngleDoubleLeft}
                        action={"prevModerationFrame"}
                    />
                    <SidebarIcon
                        className={`icon-style ${isNextButtonActive ? "" : "disabled"}`}
                        size="20px"
                        title={t("nextModerationFrame")}
                        icon={faAngleDoubleRight}
                        action={"nextModerationFrame"}
                    />
                    <SidebarIcon
                        className="icon-style"
                        size="20px"
                        title={t("hideIssues")}
                        icon={isIssuesHidden ? faEye : faEyeSlash}
                        action={"hideIssues"}
                    />
                    <SidebarIcon
                        className={`icon-style ${frameHasIssues ? "" : "disabled"}`}
                        size="20px"
                        title={t("markAllAsResolved")}
                        icon={faCheckDouble}
                        action={"markAllAsResolved"}
                    />
                </div>
            </div>
            <div className="sidebar-content">
                <div className="issues-list">
                    {issues.reduce((acc, issue, index) => {
                        if (issue.frame === activeFrameIndex) {
                            acc.push(
                                <IssueItem
                                    key={index}
                                    issue={issue}
                                    index={index}
                                    orderNumber={acc.length + 1}
                                />,
                            );
                        }
                        return acc;
                    }, [])}
                </div>
            </div>
        </div>
    );
});
