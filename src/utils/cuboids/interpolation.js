import { Vector3, Quaternion, Euler } from "three";

export const interpolatePSR = (start, end, t) => {
    const startPos = new Vector3(start.position.x, start.position.y, start.position.z);
    const endPos = new Vector3(end.position.x, end.position.y, end.position.z);
    const interpolatedPos = new Vector3().copy(startPos).lerp(endPos, t);

    const startScale = new Vector3(start.scale.x, start.scale.y, start.scale.z);
    const endScale = new Vector3(end.scale.x, end.scale.y, end.scale.z);
    const interpolatedScale = new Vector3().copy(startScale).lerp(endScale, t);

    const startQuat = new Quaternion().setFromEuler(
        new Euler(start.rotation.x, start.rotation.y, start.rotation.z),
    );
    const endQuat = new Quaternion().setFromEuler(
        new Euler(end.rotation.x, end.rotation.y, end.rotation.z),
    );
    const interpolatedQuat = new Quaternion().slerpQuaternions(startQuat, endQuat, t);
    const interpolatedEuler = new Euler().setFromQuaternion(interpolatedQuat);

    return {
        position: { x: interpolatedPos.x, y: interpolatedPos.y, z: interpolatedPos.z },
        rotation: { x: interpolatedEuler._x, y: interpolatedEuler._y, z: interpolatedEuler._z },
        scale: { x: interpolatedScale.x, y: interpolatedScale.y, z: interpolatedScale.z },
        quaternion: {
            x: interpolatedQuat.x,
            y: interpolatedQuat.y,
            z: interpolatedQuat.z,
            w: interpolatedQuat.w,
        },
    };
};

const findPrevKeyframe = (startFrame, id, cuboidsSolutionRef) => {
    for (let i = startFrame; i >= 0; i--) {
        const entry = cuboidsSolutionRef.current[i]?.find((e) => e.id === id && e.manual);
        if (entry) return { frame: i, entry };
    }
    return null;
};

const findNextKeyframe = (startFrame, id, totalFrames, cuboidsSolutionRef) => {
    for (let i = startFrame; i < totalFrames; i++) {
        const entry = cuboidsSolutionRef.current[i]?.find((e) => e.id === id && e.manual);
        if (entry) return { frame: i, entry };
    }
    return null;
};

const findNearestManualEntry = (cuboidsSolutionRef, id, start, direction, totalFrames) => {
    let i = start + direction;
    while (i >= 0 && i < totalFrames) {
        const found = cuboidsSolutionRef.current[i]?.find((e) => e.id === id && e.manual);
        if (found) return { frame: i, entry: found };
        i += direction;
    }
    return null;
};

const hasOnlyOneManualFrame = (id, cuboidsSolutionRef, totalFrames) => {
    let manualCount = 0;
    for (let i = 0; i < totalFrames; i++) {
        if (cuboidsSolutionRef.current[i]?.find((e) => e.id === id && e.manual)) {
            manualCount++;
            if (manualCount > 1) return false;
        }
    }
    return manualCount === 1;
};

const computeInterpolatedPSR = (prev, next, frame, totalFrames, cuboidsSolutionRef, id) => {
    if (hasOnlyOneManualFrame(id, cuboidsSolutionRef, totalFrames)) {
        const singleFrame = prev || next;
        if (singleFrame) {
            return JSON.parse(JSON.stringify(singleFrame.entry.psr));
        }
        return null;
    }

    if (prev && next) {
        const t = (frame - prev.frame) / (next.frame - prev.frame);
        return interpolatePSR(prev.entry.psr, next.entry.psr, t);
    }

    if (prev) {
        const prev2 = findPrevKeyframe(prev.frame - 1, prev.entry.id, cuboidsSolutionRef);
        if (prev2) {
            const t = (frame - prev.frame) / (prev.frame - prev2.frame);
            return interpolatePSR(prev2.entry.psr, prev.entry.psr, t + 1);
        }
    }

    if (next) {
        const next2 = findNextKeyframe(
            next.frame + 1,
            next.entry.id,
            totalFrames,
            cuboidsSolutionRef,
        );
        if (next2) {
            const t = (frame - next.frame) / (next2.frame - next.frame);
            return interpolatePSR(next.entry.psr, next2.entry.psr, t);
        }
    }

    return null;
};

export const interpolateBetweenFrames = ({
    cuboidsGeometriesRef,
    cuboidsSolutionRef,
    totalFrames,
    selectedId,
}) => {
    const cube = cuboidsGeometriesRef.current[selectedId]?.cube?.mesh;
    if (!cube) return;

    for (let frame = 0; frame < totalFrames; frame++) {
        const frameSolution = cuboidsSolutionRef.current[frame] ?? [];

        const entryIndex = frameSolution.findIndex((e) => e.id === selectedId);
        if (entryIndex === -1 || frameSolution[entryIndex]?.manual) continue;

        const [prev, next] = [
            findNearestManualEntry(cuboidsSolutionRef, selectedId, frame, -1, totalFrames),
            findNearestManualEntry(cuboidsSolutionRef, selectedId, frame, 1, totalFrames),
        ];

        const interpolatedPSR = computeInterpolatedPSR(
            prev,
            next,
            frame,
            totalFrames,
            cuboidsSolutionRef,
            selectedId,
        );

        if (!interpolatedPSR) continue;

        cuboidsSolutionRef.current[frame] ??= [];
        cuboidsSolutionRef.current[frame][entryIndex].psr = interpolatedPSR;
    }
};

export const computeVisibilityFrameRange = ({
    activeFrameIndex,
    id,
    cuboidsSolutionRef,
    totalFrames,
}) => {
    const solution = cuboidsSolutionRef.current;

    const frameSolution = solution[activeFrameIndex] ?? [];
    const currentKeyframeEntry = frameSolution.find((e) => e.id === id && e.manual);

    const prevKeyframe = findPrevKeyframe(activeFrameIndex - 1, id, cuboidsSolutionRef);
    const nextKeyframe = findNextKeyframe(
        activeFrameIndex + 1,
        id,
        totalFrames,
        cuboidsSolutionRef,
    );

    if (currentKeyframeEntry) {
        return { startFrame: activeFrameIndex, endFrame: activeFrameIndex };
    }

    const startFrame = prevKeyframe ? activeFrameIndex : 0;
    const endFrame = nextKeyframe ? activeFrameIndex : totalFrames - 1;

    return { startFrame, endFrame };
};

export const writePSRToSolution = ({
    mesh,
    frameIndices,
    cuboidsSolutionRef,
    manual = false,
    visible = undefined,
    preserveManual = false,
}) => {
    const id = mesh.name;
    const type = mesh.userData.label;
    const position = mesh.position.clone();
    const scale = mesh.scale.clone();
    const rotation = mesh.rotation.clone();
    const quaternion = mesh.quaternion.clone();

    for (const frameIndex of frameIndices) {
        if (!cuboidsSolutionRef.current[frameIndex]) {
            cuboidsSolutionRef.current[frameIndex] = [];
        }

        const existing = cuboidsSolutionRef.current[frameIndex].find((e) => e.id === id);
        const isVisible = visible !== undefined ? visible : (existing?.visible ?? true);

        const data = {
            id,
            type,
            manual,
            visible: isVisible,
            psr: {
                position: { x: position.x, y: position.y, z: position.z },
                rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
                scale: { x: scale.x, y: scale.y, z: scale.z },
                quaternion: { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w },
            },
            attributes: existing?.attributes || [],
        };

        if (existing) {
            Object.assign(existing, {
                ...data,
                manual: preserveManual ? existing.manual || manual : manual,
            });
        } else {
            cuboidsSolutionRef.current[frameIndex].push(data);
        }
    }
};
