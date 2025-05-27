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

import { RenderFrameSwitcherButton } from "../RenderFrameSwitcherButton";

import { playbackConfig } from "../playbackConfig";

// const COMPONENT_NAME = "FrameSwitcher.";
const COMPONENT_NAME = "";

export const FrameSwitcherControls = ({ playSpeed, isPlaying, isPlayCycle }) => {
    const { t } = useTranslation();

    const playSpeedLabel = playbackConfig.getSpeedLabel(playSpeed);

    return (
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
                    title={isPlaying ? t(`${COMPONENT_NAME}pause`) : t(`${COMPONENT_NAME}play`)}
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
                    className={`frame-switcher-button ${isPlayCycle ? "active" : ""}`}
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
    );
};
