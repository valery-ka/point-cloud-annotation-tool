import { useCallback, useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { debounce, isEmpty } from "lodash";

import { useFileManager, useEditor, useFrames, useLoading } from "contexts";

import { updatePixelProjections } from "utils/editor";
import * as APP_CONSTANTS from "constants";

const { PIXEL_PROJECTION_REQUEST_TIME } = APP_CONSTANTS;

export const useUpdatePixelProjections = (glSize) => {
    const { camera } = useThree();

    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();
    const { globalIsLoading } = useLoading();
    const { setPixelProjections, pointCloudRefs } = useEditor();

    const glSizeRef = useRef(glSize);
    const pcdFilesRef = useRef(pcdFiles);
    const activeFrameIndexRef = useRef(activeFrameIndex);

    const requestPixelProjectionsUpdate = useCallback(
        debounce(() => {
            const activeFrameFilePath = pcdFilesRef.current[activeFrameIndexRef.current];
            const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];

            if (isEmpty(activeFrameCloud?.geometry?.attributes?.original)) return;
            const projections = updatePixelProjections(
                activeFrameCloud.geometry.attributes.original.array,
                camera,
                glSizeRef.current,
            );
            setPixelProjections(projections);
        }, PIXEL_PROJECTION_REQUEST_TIME),
        [],
    );

    useEffect(() => {
        glSizeRef.current = glSize;
        pcdFilesRef.current = pcdFiles;
        activeFrameIndexRef.current = activeFrameIndex;
    }, [glSize, pcdFiles, activeFrameIndex]);

    useEffect(() => {
        setPixelProjections(new Float32Array());
        requestPixelProjectionsUpdate();
    }, [activeFrameIndex, globalIsLoading]);

    return { requestPixelProjectionsUpdate };
};
