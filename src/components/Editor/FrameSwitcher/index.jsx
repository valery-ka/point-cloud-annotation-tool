import React, { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import {
    faBackwardFast,
    faStepBackward,
    faPause,
    faPlay,
    faStepForward,
    faForwardFast,
    faRepeat,
    faChevronCircleRight,
} from "@fortawesome/free-solid-svg-icons";

import { usePCDManager, useFrames } from "@contexts";
import {
    useEventSubscriptions,
    useFrameSwitcher,
    usePlayback,
    useClickOutsideBlur,
    useFrameLaneMouseEvents,
} from "@hooks";

import { RenderFrameSwitcherButton } from "./RenderFrameSwitcherButton";

import { playbackConfig } from "./playbackConfig";

// const COMPONENT_NAME = "FrameSwitcher.";
const COMPONENT_NAME = "";

export const FrameSwitcher = memo(() => {
    const { pcdFiles } = usePCDManager();
    const { activeFrameIndex } = useFrames();

    const { t } = useTranslation();

    const frameLaneRef = useClickOutsideBlur();

    const laneMarks = useMemo(() => {
        return pcdFiles.reduce((acc, _, index) => {
            acc[index] = {
                value: index,
                isFirst: index === 0,
                isModFive: index % 5 === 0,
            };
            return acc;
        }, {});
    }, [pcdFiles]);

    const {
        isPlaying,
        isPlayCycle,
        playSpeed,
        handlePlay,
        handlePlayCycle,
        handlePlaySpeed,
        stopPlayback,
    } = usePlayback(playbackConfig);

    const {
        handleGoToFirstFrame,
        handleGoToPreviousFrame,
        handleGoToNextFrame,
        handleGoToLastFrame,
    } = useFrameSwitcher(stopPlayback);

    useEventSubscriptions(
        handleGoToFirstFrame,
        handleGoToPreviousFrame,
        handlePlay,
        handleGoToNextFrame,
        handleGoToLastFrame,
        handlePlayCycle,
        handlePlaySpeed,
    );

    const { handleMouseDownLane } = useFrameLaneMouseEvents(frameLaneRef);

    if (pcdFiles.length < 2) return null;

    const playSpeedLabel = playbackConfig.getSpeedLabel(playSpeed);

    return (
        <div className="frame-switcher">
            <div className="frame-switcher-content">
                <div className="frame-switcher-head">
                    <div className="frame-switcher-lane-timeline">
                        <div className="frame-switcher-controls">
                            <div className="frame-switcher-controls-group">
                                <RenderFrameSwitcherButton
                                    className="frame-switcher-button"
                                    title={t(`${COMPONENT_NAME}goToFirstFrame`)}
                                    action="goToFirstFrame"
                                    icon={faBackwardFast}
                                />
                                <RenderFrameSwitcherButton
                                    className="frame-switcher-button"
                                    title={t(`${COMPONENT_NAME}goToPreviousFrame`)}
                                    action="goToPreviousFrame"
                                    icon={faStepBackward}
                                />
                                <RenderFrameSwitcherButton
                                    className="frame-switcher-button"
                                    title={
                                        isPlaying
                                            ? t(`${COMPONENT_NAME}pause`)
                                            : t(`${COMPONENT_NAME}play`)
                                    }
                                    action="play"
                                    icon={isPlaying ? faPause : faPlay}
                                />
                                <RenderFrameSwitcherButton
                                    className="frame-switcher-button"
                                    title={t(`${COMPONENT_NAME}goToNextFrame`)}
                                    action="goToNextFrame"
                                    icon={faStepForward}
                                />
                                <RenderFrameSwitcherButton
                                    className="frame-switcher-button"
                                    title={t(`${COMPONENT_NAME}goToLastFrame`)}
                                    action="goToLastFrame"
                                    icon={faForwardFast}
                                />
                                <RenderFrameSwitcherButton
                                    className={`frame-switcher-button ${
                                        isPlayCycle ? "active" : ""
                                    }`}
                                    title={t(`${COMPONENT_NAME}playCycle`)}
                                    action="playCycle"
                                    icon={faRepeat}
                                />
                                <RenderFrameSwitcherButton
                                    className="frame-switcher-button"
                                    title={`${t(`${COMPONENT_NAME}playSpeed`)}: ${playSpeedLabel}`}
                                    action="playSpeed"
                                    icon={faChevronCircleRight}
                                />
                            </div>
                        </div>
                        <div className="frame-switcher-lane-frames" ref={frameLaneRef}>
                            {Object.entries(laneMarks).map(
                                ([key, { value, isFirst, isModFive }]) => (
                                    <div
                                        key={key}
                                        className={`frame-switcher-frame-container ${
                                            value === activeFrameIndex ? "selected" : ""
                                        }`}
                                        onMouseDown={(e) => {
                                            stopPlayback();
                                            handleMouseDownLane(e, value);
                                        }}
                                    >
                                        <div
                                            className={`frame-switcher-frame ${
                                                isFirst ? "first" : isModFive ? "mod-five" : ""
                                            }`}
                                        ></div>
                                        <div className="frame-switcher-frame-text">
                                            {/* {value} */}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
