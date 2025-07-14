import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { useFileManager } from "contexts";

import { clearThreeScene } from "utils/cleaners";

export const usePointCloudEditorWillUnmount = () => {
    const { scene } = useThree();
    const { folderName } = useFileManager();

    useEffect(() => {
        return () => {
            clearThreeScene(scene);
        };
    }, [scene, folderName]);
};
