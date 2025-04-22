import { ShaderMaterial, Vector3 } from "three";

export const PointHighlighterShader = ({
    sizeMultiplier = 1,
    theme = "dark",
    THEME_COLORS = {
        light: { shadowColor: [0.8, 0.8, 0.8] },
        dark: { shadowColor: [0.0, 0.0, 0.0] },
    },
    highlightScale = 1.0,
    useAlpha = false,
}) => {
    return new ShaderMaterial({
        uniforms: {
            uSizeMultiplier: { value: sizeMultiplier },
            uHighlightedIndex: { value: -1 },
            uHighlightScale: { value: highlightScale * 10 },
            uShadowColor: {
                value: new Vector3(...THEME_COLORS[theme].shadowColor),
            },
            uUseAlphaAttribute: { value: useAlpha },
        },
        vertexShader: `
            attribute float size_highlighter;
            attribute float alpha_highlighter;
            attribute float indices;

            uniform float uSizeMultiplier;
            uniform float uHighlightedIndex;
            uniform float uHighlightScale;

            uniform bool uUseAlphaAttribute;

            varying vec3 vColor;
            varying float vAlpha;

            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;

                float multiplier = (indices == uHighlightedIndex) ? uSizeMultiplier + uHighlightScale : uSizeMultiplier;
                gl_PointSize = size_highlighter + multiplier;

                vColor = color;
                vAlpha = uUseAlphaAttribute ? alpha_highlighter : 1.0;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;
            uniform vec3 uShadowColor;

            void main() {
                vec2 coord = gl_PointCoord * 2.0 - 1.0;
                float dist = length(coord);

                if (dist > 1.0) {
                    discard;
                }

                float shadow = smoothstep(0.5, 1.5, dist);
                vec4 shadowColor = vec4(uShadowColor, vAlpha);
                vec4 finalColor = vec4(vColor, vAlpha);
                gl_FragColor = mix(finalColor, shadowColor, shadow);
            }
        `,
        vertexColors: true,
        transparent: true,
        depthTest: true,
    });
};
