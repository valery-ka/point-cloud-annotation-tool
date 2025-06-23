import { Vector3, Euler, Quaternion, Matrix4 } from "three";

export const computeRelativeMatrix = (frames, baseFrameIndex, sourceId, targetId) => {
    const baseFrame = frames[baseFrameIndex];
    const sourceCuboid = baseFrame.find((c) => c.id === sourceId);
    const targetCuboid = baseFrame.find((c) => c.id === targetId);
    if (!sourceCuboid || !targetCuboid) return null;

    const sourcePos = new Vector3().copy(sourceCuboid.psr.position);
    const sourceQuat = new Quaternion().setFromEuler(
        new Euler(
            sourceCuboid.psr.rotation.x,
            sourceCuboid.psr.rotation.y,
            sourceCuboid.psr.rotation.z,
        ),
    );
    const sourceMatrix = new Matrix4().compose(sourcePos, sourceQuat, new Vector3(1, 1, 1));

    const targetPos = new Vector3().copy(targetCuboid.psr.position);
    const targetQuat = new Quaternion().setFromEuler(
        new Euler(
            targetCuboid.psr.rotation.x,
            targetCuboid.psr.rotation.y,
            targetCuboid.psr.rotation.z,
        ),
    );
    const targetMatrix = new Matrix4().compose(targetPos, targetQuat, new Vector3(1, 1, 1));

    const sourceMatrixInverse = sourceMatrix.clone().invert();
    const relativeMatrix = sourceMatrixInverse.multiply(targetMatrix);

    return relativeMatrix;
};

export const computeOdometryTransform = (odometry, sourcePath, targetPath) => {
    const sourceMatrix = odometry[sourcePath];
    const targetMatrix = odometry[targetPath];
    if (!sourceMatrix || !targetMatrix) return null;

    const sourceMatrixInv = sourceMatrix.clone().invert();
    return sourceMatrixInv.multiply(targetMatrix);
};

const applyMatrixTransformation = (sourceCuboid, targetCuboid, keyFrame, matrixTransformer) => {
    const sourcePos = new Vector3().copy(sourceCuboid.psr.position);
    const sourceQuat = new Quaternion().setFromEuler(
        new Euler(
            sourceCuboid.psr.rotation.x,
            sourceCuboid.psr.rotation.y,
            sourceCuboid.psr.rotation.z,
        ),
    );
    const sourceMatrix = new Matrix4().compose(sourcePos, sourceQuat, new Vector3(1, 1, 1));

    const finalMatrix = matrixTransformer(sourceMatrix);

    const finalPos = new Vector3();
    const finalQuat = new Quaternion();
    const finalScale = new Vector3();

    finalMatrix.decompose(finalPos, finalQuat, finalScale);
    const finalEuler = new Euler().setFromQuaternion(finalQuat);

    targetCuboid.psr.position = { x: finalPos.x, y: finalPos.y, z: finalPos.z };
    targetCuboid.psr.rotation = { x: finalEuler.x, y: finalEuler.y, z: finalEuler.z };
    targetCuboid.psr.quaternion = {
        x: finalQuat.x,
        y: finalQuat.y,
        z: finalQuat.z,
        w: finalQuat.w,
    };

    targetCuboid.manual = keyFrame ? true : sourceCuboid.manual;
};

export const applyOdometryTransform = (
    frames,
    baseFrameIndex,
    frameIndex,
    cuboidId,
    odomMatrix,
) => {
    const baseFrame = frames[baseFrameIndex];
    const frame = frames[frameIndex];
    if (!baseFrame || !frame) return;

    const baseCuboid = baseFrame.find((c) => c.id === cuboidId);
    const targetCuboid = frame.find((c) => c.id === cuboidId);
    if (!baseCuboid || !targetCuboid) return;

    const keyFrame = true;

    applyMatrixTransformation(baseCuboid, targetCuboid, keyFrame, (baseMatrix) => {
        return odomMatrix.clone().invert().multiply(baseMatrix);
    });
};

export const applyRelativeMatrix = (frames, sourceId, targetId, relativeMatrix) => {
    frames.forEach((frame) => {
        const sourceCuboid = frame.find((c) => c.id === sourceId);
        const targetCuboid = frame.find((c) => c.id === targetId);
        if (!sourceCuboid || !targetCuboid) return;

        const keyFrame = false;

        applyMatrixTransformation(sourceCuboid, targetCuboid, keyFrame, (sourceMatrix) => {
            return sourceMatrix.clone().multiply(relativeMatrix);
        });
    });
};
