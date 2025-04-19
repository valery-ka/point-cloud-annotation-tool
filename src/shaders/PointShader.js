import { ShaderMaterial, Vector3 } from "three";

export const PointShader = (
    sizeMultiplier = 1,
    theme = "dark",
    THEME_COLORS = {
        light: { shadowColor: [0.8, 0.8, 0.8] },
        dark: { shadowColor: [0.0, 0.0, 0.0] },
    },
) => {
    return new ShaderMaterial({
        uniforms: {
            uSizeMultiplier: { value: sizeMultiplier },
            uShadowColor: {
                value: new Vector3(...THEME_COLORS[theme].shadowColor),
            },
        },
        vertexShader: `
            attribute float size;
            uniform float uSizeMultiplier;
            varying vec3 vColor;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * uSizeMultiplier;
                gl_Position = projectionMatrix * mvPosition;
                vColor = color;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            uniform vec3 uShadowColor;
            
            void main() {
                vec2 coord = gl_PointCoord * 2.0 - 1.0;
                float dist = length(coord);
                
                if (dist > 1.0) {
                    discard;
                }
                
                float shadow = smoothstep(0.5, 1.5, dist);
                vec4 shadowColor = vec4(uShadowColor, 1.0);
                vec4 finalColor = vec4(vColor, 1.0);
                gl_FragColor = mix(finalColor, shadowColor, shadow);
            }
        `,
        vertexColors: true,
    });
};
