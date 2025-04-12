import { useEffect, useMemo, useCallback } from "react";
import { Tooltip } from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";

import { useModeration, useConfig, useFrames, usePCDManager } from "contexts";
import { useMousetrapPause } from "hooks";

import { TextInputField } from "../TextInputField";

import { API_PATHS } from "config/apiPaths";

const { SOLUTION } = API_PATHS;

export const ModerationMenu = ({
    menuRef,
    isOpened,
    resetContextMenu,
    contextMenuPosition,
    pointIndex,
    isTextInputOpened,
    setIsTextInputOpened,
}) => {
    const { config } = useConfig();
    const { moderation } = config;
    const { activeFrameIndex } = useFrames();
    const { issues, setIssues } = useModeration();
    const { folderName } = usePCDManager();

    const pointIssuesList = useMemo(() => {
        return moderation?.filter(({ applicableTo }) => applicableTo === "point");
    }, [config]);

    const objectIssuesList = useMemo(() => {
        return moderation?.filter(({ applicableTo }) => applicableTo === "object");
    }, [config]);

    const saveIssuesList = useCallback(() => {
        const issuesJSON = JSON.stringify(issues);

        fetch(SOLUTION.MODERATION(folderName), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: issuesJSON,
        }).then((response) => response.json());
    }, [issues]);

    useEffect(() => {
        if (folderName.length > 0) {
            saveIssuesList();
        }
    }, [issues]);

    const addIssue = useCallback(
        (issue) => {
            if (issue.value === "OTHER" && !issue.workerHint) {
                setIsTextInputOpened(true);
                return;
            }

            const point = pointIndex.current.index;
            const position = pointIndex.current.position;

            setIssues((prevIssues) => {
                const newIssue = {
                    type: "point",
                    frame: activeFrameIndex,
                    pointIndex: point,
                    position: position,
                    issue: issue.value,
                    workerHint: issue.workerHint,
                    resolved: false,
                };
                return [...prevIssues, newIssue];
            });
            resetContextMenu();
        },
        [activeFrameIndex, contextMenuPosition],
    );

    const handleContextMenuClick = useCallback(
        (issue) => {
            addIssue(issue);
        },
        [addIssue],
    );

    const handleKeyDown = useCallback(
        (event) => {
            if (event.key >= "1" && event.key <= "9" && isOpened && !isTextInputOpened) {
                const issue = pointIssuesList[+event.key - 1];
                if (issue) {
                    addIssue(issue);
                }
            }
        },
        [addIssue, isTextInputOpened],
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpened, isTextInputOpened, contextMenuPosition]);

    useMousetrapPause(isOpened);

    if (!moderation?.length) return null;

    return (
        <div
            ref={menuRef}
            className={`context-menu ${isOpened ? "" : "context-menu-hidden"}`}
            style={{
                left: `${contextMenuPosition.x}px`,
                top: `${contextMenuPosition.y}px`,
            }}
        >
            <div className="context-menu-content">
                {isTextInputOpened ? (
                    <TextInputField
                        resetContextMenu={resetContextMenu}
                        setIsTextInputOpened={setIsTextInputOpened}
                        addIssue={addIssue}
                    />
                ) : (
                    pointIssuesList?.map((issue, index) => (
                        <div key={issue.value} className="context-menu-item-container">
                            <div
                                className="context-menu-item"
                                onClick={() => handleContextMenuClick(issue)}
                            >
                                <div className="context-menu-item-color">{index + 1}</div>
                                <div className="context-menu-item-title">{issue.title}</div>
                                <div
                                    className="context-menu-item-info"
                                    data-tooltip-id={`tooltip-${issue.value}`}
                                    data-tooltip-html={issue?.moderatorHint}
                                >
                                    <FontAwesomeIcon icon={faQuestionCircle} className="icon" />
                                </div>
                                <Tooltip
                                    id={`tooltip-${issue.value}`}
                                    place="bottom"
                                    effect="solid"
                                    delayShow={300}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
