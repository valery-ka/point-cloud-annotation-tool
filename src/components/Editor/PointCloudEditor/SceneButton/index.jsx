import { useState, useEffect, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useTranslation } from "react-i18next";

import { useEvent, useConfig } from "contexts";

import { TABS } from "constants";

export const SceneButton = ({ index, position, buttonIndex, resolved, checked, workerHint }) => {
    const { t } = useTranslation();

    const { gl } = useThree();
    const { domElement } = gl;

    const { publish } = useEvent();
    const { isModerationJob } = useConfig();

    const [isMouseDown, setIsMouseDown] = useState(false);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        const handleMouseDown = () => setIsMouseDown(true);
        const handleMouseUp = () => setIsMouseDown(false);

        domElement.addEventListener("mousedown", handleMouseDown);
        domElement.addEventListener("mouseup", handleMouseUp);

        return () => {
            domElement.removeEventListener("mousedown", handleMouseDown);
            domElement.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    const handleWheel = useCallback((event) => {
        event.stopPropagation();
        domElement.dispatchEvent(new WheelEvent("wheel", event));
    }, []);

    const setActiveTab = useCallback(() => {
        publish("setActiveTab", TABS.MODERATION);
    }, [publish]);

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

    if (resolved || checked) return;

    return (
        <Html position={position} zIndexRange={[10, 10]}>
            <div
                className="scene-button-wrapper"
                onMouseEnter={() => setShowHint(true)}
                onMouseLeave={() => setShowHint(false)}
                onWheel={handleWheel}
            >
                <button
                    className="scene-button"
                    onClick={() => setActiveTab()}
                    onMouseDown={(e) => e.preventDefault()}
                    style={{ pointerEvents: isMouseDown ? "none" : "auto" }}
                >
                    {buttonIndex}
                </button>

                {showHint && (
                    <div className="issue-hover">
                        <div className="issue-hover-text">{workerHint}</div>
                        {isModerationJob ? (
                            <div className="issue-hover-buttons">
                                <button
                                    className="issue-hover-button"
                                    onClick={() => resolveIssue()}
                                >
                                    {t("resolve")}
                                </button>
                                <button
                                    className="issue-hover-button"
                                    onClick={() => removeIssue()}
                                >
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
                )}
            </div>
        </Html>
    );
};
