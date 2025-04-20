import { ShaderMaterial, Vector2, Vector3 } from "three";

export const DistortedPointShader = ({
    sizeMultiplier = 1,
    theme = "dark",
    THEME_COLORS = {
        light: { shadowColor: [0.8, 0.8, 0.8] },
        dark: { shadowColor: [0.0, 0.0, 0.0] },
    },
    distortion = [],
    imageWidth = 0,
    imageHeight = 0,
}) => {
    return new ShaderMaterial({
        uniforms: {
            uSizeMultiplier: { value: sizeMultiplier },
            uShadowColor: {
                value: new Vector3(...THEME_COLORS[theme].shadowColor),
            },
            uDistortion: { value: distortion },
            uApplyDistortion: { value: true },
            uImageResolution: { value: new Vector2(imageWidth, imageHeight) },
        },
        vertexShader: `
            attribute float size;
            uniform float uSizeMultiplier;
            uniform vec2 uImageResolution;
            uniform float uApplyDistortion;
            uniform float uDistortion[8];

            varying vec3 vColor;

            vec2 applyFisheyeDistortion(vec2 normCoords, float[8] d) {
                float k1 = d[0], k2 = d[1], p1 = d[2], p2 = d[3];
                float k3 = d[4], k4 = d[5], k5 = d[6], k6 = d[7];

                float x = normCoords.x;
                float y = normCoords.y;

                float r2 = x * x + y * y;
                float r4 = r2 * r2;
                float r6 = r4 * r2;

                float radial_num = 1.0 + k1 * r2 + k2 * r4 + k3 * r6;
                float radial_denom = 1.0 + k4 * r2 + k5 * r4 + k6 * r6;
                float radial = radial_denom != 0.0 ? radial_num / radial_denom : 1.0;

                x *= radial;
                y *= radial;

                float x_dist = x + 2.0 * p1 * x * y + p2 * (r2 + 2.0 * x * x);
                float y_dist = y + p1 * (r2 + 2.0 * y * y) + 2.0 * p2 * x * y;

                return vec2(x_dist, y_dist);
            }

            void main() {
                vec2 normCoords = position.xy;

                if (uApplyDistortion > 0.5) {
                    normCoords = applyFisheyeDistortion(normCoords, uDistortion);
                }

                vec4 distortedPosition = vec4(normCoords, position.z, 1.0);
                vec4 mvPosition = modelViewMatrix * distortedPosition;
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
