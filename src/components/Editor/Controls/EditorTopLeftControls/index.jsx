import React, { useState, useCallback, memo } from "react";
import {
    faHome,
    faUndo,
    faRedo,
    faCube,
    faCircleDot,
    faArrowsUpDown,
} from "@fortawesome/free-solid-svg-icons";
import Slider from "rc-slider";
import { useTranslation } from "react-i18next";

import { useEvent } from "@contexts";
import { useButtonState } from "@hooks";
import * as APP_CONSTANTS from "@constants";

import { RenderEditorButton } from "../RenderEditorButton";

// const COMPONENT_NAME = "EditorTopLeftControls.";
const COMPONENT_NAME = "";

const { MIN, MAX, STEP } = APP_CONSTANTS.Z_FILTER;
const NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;
const POSITIVE_INFINITY = Number.POSITIVE_INFINITY;

export const EditorTopLeftControls = memo(() => {
    const { publish } = useEvent();

    const { t } = useTranslation();

    const [isMinMaxZSliderVisible, setIsMinMaxZSliderVisible] = useState(false);
    const [minMaxZValue, setMinMaxZValue] = useState([MIN, MAX]);

    const toggleMinMaxZSlider = useCallback(() => {
        setIsMinMaxZSliderVisible((prev) => !prev);
    }, []);

    const calculateMinMaxZPopUpValue = useCallback(
        (value) => (value === MIN ? "−∞" : value === MAX ? "∞" : `${value.toFixed(2)}m`),
        [],
    );

    const handleMinMaxZChange = useCallback(
        (value) => {
            setMinMaxZValue(value);

            const minZ = value[0] === MIN ? NEGATIVE_INFINITY : value[0];
            const maxZ = value[1] === MAX ? POSITIVE_INFINITY : value[1];

            publish("minMaxZ", [minZ, maxZ]);
        },
        [publish],
    );

    const buttonStates = useButtonState(["undo", "redo"]);

    const renderButton = (name, icon, type, actionType, persistent, toggleable, onClick) => {
        return (
            <RenderEditorButton
                className={`tool-3d-control-button ${type}`}
                title={t(`${COMPONENT_NAME}${name}`)}
                actionType={actionType}
                action={`${name}`}
                icon={icon}
                persistent={persistent}
                toggleable={toggleable}
                onClick={onClick}
            />
        );
    };

    return (
        <div className="controls-top-left">
            <div className="tool-3d-controls-group">
                {renderButton("switchToOriginView", faHome, "single", "camera")}
            </div>
            <div className="tool-3d-controls-group">
                {renderButton(
                    "undoAction",
                    faUndo,
                    `left ${buttonStates.undo ? "" : "disabled"}`,
                    "misc",
                )}
                {renderButton(
                    "redoAction",
                    faRedo,
                    `right ${buttonStates.redo ? "" : "disabled"}`,
                    "misc",
                )}
            </div>
            <div className="tool-3d-controls-group">
                {renderButton("toggleGlobalBox", faCube, "left", "misc", true)}
                {renderButton("toggleCircleRuler", faCircleDot, "right", "misc", true)}
            </div>
            <div className="tool-3d-controls-group">
                {renderButton(
                    "earthSkyLevels",
                    faArrowsUpDown,
                    "single",
                    "misc",
                    false,
                    true,
                    toggleMinMaxZSlider,
                )}
                {isMinMaxZSliderVisible && (
                    <div className="pop-up-slider">
                        <div className="horizontal-slider-range min-max-value">
                            {calculateMinMaxZPopUpValue(minMaxZValue[0])}
                        </div>
                        <div className="horizontal-slider-range">
                            <Slider
                                range
                                min={MIN}
                                max={MAX}
                                step={STEP}
                                allowCross={false}
                                pushable={STEP}
                                value={minMaxZValue}
                                onChange={handleMinMaxZChange}
                            />
                        </div>
                        <div className="horizontal-slider-range min-max-value">
                            {calculateMinMaxZPopUpValue(minMaxZValue[1])}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});
