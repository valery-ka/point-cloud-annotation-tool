import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

export const IssueSceneInfo = memo(({ hint, index, setShowHint, publish, isModerationJob }) => {
    const { t } = useTranslation();

    const resolveIssue = useCallback(() => {
        publish("resolveIssue", { index });
        setShowHint(false);
    }, [publish]);

    const removeIssue = useCallback(() => {
        publish("removeIssue", { index });
        setShowHint(false);
    }, [publish]);

    const checkIssue = useCallback(() => {
        publish("checkIssue", { index });
        setShowHint(false);
    }, [publish]);

    return (
        <>
            <div className="issue-hover">
                <div className="issue-hover-text">{hint}</div>
                {isModerationJob ? (
                    <div className="issue-hover-buttons">
                        <button className="issue-hover-button" onClick={() => resolveIssue()}>
                            {t("resolve")}
                        </button>
                        <button className="issue-hover-button" onClick={() => removeIssue()}>
                            {t("remove")}
                        </button>
                    </div>
                ) : (
                    <div className="issue-hover-buttons">
                        <button className="issue-hover-button" onClick={() => checkIssue()}>
                            {t("check")}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
});
