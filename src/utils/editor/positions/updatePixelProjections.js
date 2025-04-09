import { Vector3, Frustum, Matrix4 } from "three";

export const updatePixelProjections = (positionArray, camera, size) => {
    if (!positionArray) return new Float32Array();

    const frustum = new Frustum();
    const frustumMatrix = new Matrix4();
    const vector = new Vector3();

    frustumMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(frustumMatrix);

    const projections = [];

    for (let i = 0; i < positionArray.length; i += 3) {
        vector.set(
            positionArray[i],
            positionArray[i + 1],
            positionArray[i + 2]
        );
        if (!frustum.containsPoint(vector)) continue;

        vector.project(camera);
        const pixelX = (vector.x * size.width) / 2 + size.width / 2;
        const pixelY = -(vector.y * size.height) / 2 + size.height / 2;

        projections.push(i / 3, pixelX, pixelY);
    }

    return new Float32Array(projections);
};
