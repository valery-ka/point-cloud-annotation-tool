import { memo } from "react";
import {
    faRotate,
    faArrowsAlt,
    faVectorSquare,
    faXmark,
    faExchangeAlt,
    faRotateForward,
    faRotateBackward,
    faLocationArrow,
} from "@fortawesome/free-solid-svg-icons";

import { useTranslation } from "react-i18next";
import { useCuboids, useEvent, useEditor } from "contexts";

import { useSubscribeFunction } from "hooks";

import { RenderEditorButton } from "../../RenderEditorButton";

import { getCuboidMeshPositionById } from "utils/cuboids";

import * as APP_CONSTANTS from "constants";

// const COMPONENT_NAME = "EditorSideLeftControls.";
const COMPONENT_NAME = "";
const { DEFAULT_TRANSFORM_MODE } = APP_CONSTANTS;

export const TransformControlsButtons = memo(() => {
    const { t } = useTranslation();
    const { publish } = useEvent();

    const { transformControlsRef } = useEditor();
    const {
        selectedCuboidGeometryRef,
        cuboidsGeometriesRef,
        selectedCuboid,
        transformMode,
        setTransformMode,
        isCuboidTransformingRef,
    } = useCuboids();

    const updateCuboidState = () => {
        isCuboidTransformingRef.current = true;
        transformControlsRef.current.dispatchEvent({ type: "change" });
        transformControlsRef.current.dispatchEvent({ type: "dragging-changed" });
    };

    const rotateObjectPlus = () => {
        const toFlip = selectedCuboidGeometryRef.current;
        toFlip.rotateZ(-Math.PI / 2);

        updateCuboidState();
    };

    useSubscribeFunction("rotateObjectPlus", rotateObjectPlus, []);

    const rotateObjectMinus = () => {
        const toFlip = selectedCuboidGeometryRef.current;
        toFlip.rotateZ(Math.PI / 2);
        updateCuboidState();
    };

    useSubscribeFunction("rotateObjectMinus", rotateObjectMinus, []);

    const flipObjectZ = () => {
        const toFlip = selectedCuboidGeometryRef.current;
        toFlip.rotateZ(Math.PI);
        updateCuboidState();
    };

    useSubscribeFunction("flipObjectZ", flipObjectZ, []);

    const switchViewToCuboid = () => {
        const target = getCuboidMeshPositionById(cuboidsGeometriesRef, selectedCuboid.id);
        publish("switchCameraToPoint", target);
    };

    useSubscribeFunction("switchViewToCuboid", switchViewToCuboid, []);

    const renderTransformModeButton = (mode, icon, iconPosition = "") => {
        return (
            <RenderEditorButton
                className={`tool-3d-control-button ${iconPosition} ${
                    transformMode === mode ? "selected" : ""
                } `}
                title={t(`${COMPONENT_NAME}${mode}`)}
                actionType={"cuboids"}
                action={mode}
                icon={icon}
                onClick={() => setTransformMode(mode)}
            />
        );
    };

    const renderActionButton = (action, icon, iconPosition = "", onClick) => {
        return (
            <RenderEditorButton
                className={`tool-3d-control-button ${iconPosition}`}
                title={t(`${COMPONENT_NAME}${action}`)}
                actionType={"cuboids"}
                action={action}
                icon={icon}
                onClick={onClick}
            />
        );
    };

    return (
        <>
            <div className="tool-3d-controls-group--horizontal">
                <div className="tool-3d-controls-group--vertical">
                    {renderTransformModeButton(DEFAULT_TRANSFORM_MODE, faXmark, "top")}
                    {renderTransformModeButton("transformTranslate", faArrowsAlt)}
                    {renderTransformModeButton("transformRotate", faRotate)}
                    {renderTransformModeButton("transformScale", faVectorSquare, "bottom")}
                </div>
                <div className="tool-3d-controls-group--vertical">
                    {renderActionButton("rotateObjectPlus", faRotateForward, "top")}
                    {renderActionButton("rotateObjectMinus", faRotateBackward)}
                    {renderActionButton("flipObjectZ", faExchangeAlt)}
                    {renderActionButton("switchViewToCuboid", faLocationArrow, "bottom")}
                </div>
            </div>
        </>
    );
});
