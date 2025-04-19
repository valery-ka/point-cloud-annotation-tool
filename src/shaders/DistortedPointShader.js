import { ShaderMaterial, Vector2, Vector3 } from "three";

export const DistortedPointShader = ({
    sizeMultiplier = 1,
    imageWidth = 3840,
    imageHeight = 2400,
    distortion = [],
    theme = "light",
    THEME_COLORS = {
        light: { shadowColor: [0.8, 0.8, 0.8] },
        dark: { shadowColor: [0.2, 0.2, 0.2] },
    },
}) => {
    return new ShaderMaterial({
        uniforms: {
            uSizeMultiplier: { value: sizeMultiplier },
            uShadowColor: { value: new Vector3(...THEME_COLORS[theme].shadowColor) },
            uImageSize: { value: new Vector2(imageWidth, imageHeight) },
            uDistortion: { value: new Float32Array(distortion) },
        },
        vertexShader: `
            attribute float size;
            varying vec3 vColor;

            uniform float uSizeMultiplier;
            uniform vec2 uImageSize;
            uniform float uDistortion[8];

            void main() {
                vec2 center = uImageSize * 0.5;
                vec2 norm = (position.xy - center) / center;

                float r2 = dot(norm, norm);
                float r4 = r2 * r2;
                float r6 = r4 * r2;

                float k1 = uDistortion[0];
                float k2 = uDistortion[1];
                float p1 = uDistortion[2];
                float p2 = uDistortion[3];
                float k3 = uDistortion[4];
                float k4 = uDistortion[5];
                float k5 = uDistortion[6];
                float k6 = uDistortion[7];

                float radial_num = 1.0 + k1 * r2 + k2 * r4 + k3 * r6;
                float radial_denom = 1.0 + k4 * r2 + k5 * r4 + k6 * r6;
                float radial = (radial_denom != 0.0) ? (radial_num / radial_denom) : 1.0;

                vec2 distorted = norm * radial;
                distorted.x += 2.0 * p1 * norm.x * norm.y + p2 * (r2 + 2.0 * norm.x * norm.x);
                distorted.y += p1 * (r2 + 2.0 * norm.y * norm.y) + 2.0 * p2 * norm.x * norm.y;

                vec2 newPos = distorted * center;

                vec4 mvPosition = modelViewMatrix * vec4(newPos.xy, 0.1, 1.0);
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

                if (dist > 1.0) discard;

                float shadow = smoothstep(0.5, 1.5, dist);
                vec4 shadowColor = vec4(uShadowColor, 1.0);
                vec4 finalColor = vec4(vColor, 1.0);
                gl_FragColor = mix(finalColor, shadowColor, shadow);
            }
        `,
        vertexColors: true,
    });
};
