import { Color, Points, Vector3 } from "three";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { useSettings } from "contexts";

const THEME_COLORS = {
    light: {
        background: "#f0f0f4",
        points: "#888888",
        shadowColor: new Vector3(0.8, 0.8, 0.8),
    },
    dark: {
        background: "#111114",
        points: "#dddddd",
        shadowColor: new Vector3(0.0, 0.0, 0.0),
    },
};

export const useEditorTheme = () => {
    const { scene } = useThree();
    const { settings } = useSettings();

    useEffect(() => {
        scene.background = new Color(THEME_COLORS[settings.general.theme].background);

        const pointsObjects = scene.children.filter((child) => child instanceof Points);

        if (pointsObjects) {
            const shadowColor = pointsObjects[0]?.material.uniforms.uShadowColor;

            const newShadowColor = THEME_COLORS[settings.general.theme].shadowColor;

            shadowColor?.value.copy(newShadowColor);
        }
    }, [settings.general.theme, scene]);

    return { THEME_COLORS };
};
