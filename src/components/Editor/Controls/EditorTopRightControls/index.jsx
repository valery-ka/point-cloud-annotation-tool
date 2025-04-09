import React, { memo } from "react";
import {
    faArrowDownLong,
    faArrowRightLong,
    faCircle,
    faArrowLeftLong,
    faArrowUpLong,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

import { RenderEditorButton } from "../RenderEditorButton";

// const COMPONENT_NAME = "EditorTopRightControls.";
const COMPONENT_NAME = "";

export const EditorTopRightControls = memo(() => {
    const { t } = useTranslation();

    const renderButton = (name, icon, iconType) => {
        return (
            <RenderEditorButton
                className={`tool-3d-control-button ${iconType}`}
                title={t(`${COMPONENT_NAME}${name}`)}
                actionType={"camera"}
                action={`${name}`}
                icon={icon}
            />
        );
    };

    return (
        <div className="controls-top-right">
            <div className="camera-view">
                <div className="camera-view-wrap">
                    <div className="button camera-view-button front">
                        {renderButton(
                            "switchToFrontView",
                            faArrowDownLong,
                            "top"
                        )}
                    </div>
                    <div className="button camera-view-button left">
                        {renderButton(
                            "switchToLeftView",
                            faArrowRightLong,
                            "left"
                        )}
                    </div>
                    <div className="button camera-view-button top">
                        {renderButton("switchToTopView", faCircle, "middle")}
                    </div>
                    <div className="button camera-view-button right">
                        {renderButton(
                            "switchToRightView",
                            faArrowLeftLong,
                            "right"
                        )}
                    </div>
                    <div className="button camera-view-button back">
                        {renderButton(
                            "switchToBackView",
                            faArrowUpLong,
                            "bottom"
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});
