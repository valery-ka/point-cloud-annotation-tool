import { Scene } from "three";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

import { useBatch } from "contexts";

export const useBatchEditorScene = ({ handlers }) => {
    const { scene } = useThree();
    const { batchMode } = useBatch();

    const batchSceneRef = useRef(new Scene());

    useEffect(() => {
        if (!batchMode || !handlers) {
            const batchScene = batchSceneRef.current;
            batchScene.traverse((obj) => {
                if (obj.geometry) {
                    obj.geometry.dispose();
                }
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((m) => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
                if (obj.texture) {
                    obj.texture.dispose();
                }
            });
            batchScene.clear();
            return;
        }

        batchSceneRef.current.background = scene.background;
    }, [batchMode]);

    return { batchSceneRef };
};
