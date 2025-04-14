import { useEffect, useRef, useCallback } from "react";
import { useThree } from "@react-three/fiber";

import { useFileManager, useEditor, useFrames, useSettings } from "contexts";
import { useSubscribeFunction } from "hooks";

import { drawGlobalBox, drawCircleRuler } from "utils/editor";

export const useEditorHelpers = () => {
    const { scene } = useThree();
    const { settings } = useSettings();

    const { pcdFiles } = useFileManager();
    const { activeFramePositionsRef } = useEditor();
    const { activeFrameIndex, areFramesLoading } = useFrames();

    const boundingBoxRef = useRef(null);
    const isBoxActive = useRef(settings.activeButtons.toggleGlobalBox);

    const circleRulerRef = useRef(null);
    const isCircleRulerActive = useRef(settings.activeButtons.toggleCircleRuler);

    const updateGlobalBox = useCallback(() => {
        drawGlobalBox(activeFramePositionsRef.current, scene, boundingBoxRef, isBoxActive.current);
    }, [pcdFiles, activeFrameIndex, areFramesLoading]);

    const toggleGlobalBox = useCallback(() => {
        isBoxActive.current = !isBoxActive.current;
        drawGlobalBox(activeFramePositionsRef.current, scene, boundingBoxRef, isBoxActive.current);
    }, []);

    useSubscribeFunction("toggleGlobalBox", toggleGlobalBox, []);

    const toggleCircleRuler = useCallback(() => {
        isCircleRulerActive.current = !isCircleRulerActive.current;
        drawCircleRuler(scene, circleRulerRef, isCircleRulerActive.current);
    }, []);

    useSubscribeFunction("toggleCircleRuler", toggleCircleRuler, []);

    useEffect(() => {
        drawCircleRuler(scene, circleRulerRef, isCircleRulerActive.current);
    }, []);

    return updateGlobalBox;
};
