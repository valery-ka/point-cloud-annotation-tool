import { memo } from "react";

import { IssueSceneInfo } from "../../IssueSceneInfo";

const ADD_ISSUE_ICON = "🤬";

export const CuboidIssue = memo(
    ({
        index,
        text,
        showAddIssueButton,
        hasIssue,
        onAddIssueClick,
        onIssueClick,
        issueHidden,
        issueHint,
        publish,
        isModerationJob,
        showHint,
        setShowHint,
    }) => {
        return (
            <>
                {/* кнопка поставленной ошибки */}
                {hasIssue && !issueHidden && (
                    <>
                        <button
                            className="scene-button"
                            onClick={onIssueClick}
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            {text}
                        </button>
                        {/* подсказка для ошибки */}
                        {showHint && (
                            <IssueSceneInfo
                                hint={issueHint}
                                index={index}
                                publish={publish}
                                setShowHint={setShowHint}
                                isModerationJob={isModerationJob}
                            />
                        )}
                    </>
                )}
                {/* кнопка для добавления ошибки к кубоиду */}
                {isModerationJob && !hasIssue && showAddIssueButton && (
                    <button
                        className="scene-button"
                        onClick={onAddIssueClick}
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        {ADD_ISSUE_ICON}
                    </button>
                )}
            </>
        );
    },
);
