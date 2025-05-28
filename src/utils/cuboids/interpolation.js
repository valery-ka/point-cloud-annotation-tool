export const interpolatePSR = (start, end, t) => {
    const lerp = (a, b) => a + (b - a) * t;

    return {
        position: {
            x: lerp(start.position.x, end.position.x),
            y: lerp(start.position.y, end.position.y),
            z: lerp(start.position.z, end.position.z),
        },
        rotation: {
            x: lerp(start.rotation.x, end.rotation.x),
            y: lerp(start.rotation.y, end.rotation.y),
            z: lerp(start.rotation.z, end.rotation.z),
        },
        scale: {
            x: lerp(start.scale.x, end.scale.x),
            y: lerp(start.scale.y, end.scale.y),
            z: lerp(start.scale.z, end.scale.z),
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
    for (let frame = 0; frame < totalFrames; frame++) {
        const frameSolution = cuboidsSolutionRef.current[frame] ?? [];

        const entry = frameSolution.find((e) => e.id === selectedId);
        if (!entry || entry.manual) continue;

        const cube = cuboidsGeometriesRef.current[selectedId]?.cube?.mesh;
        if (!cube) continue;

        const prev = findNearestManualEntry(cuboidsSolutionRef, selectedId, frame, -1, totalFrames);
        const next = findNearestManualEntry(cuboidsSolutionRef, selectedId, frame, 1, totalFrames);
        const interpolatedPSR = computeInterpolatedPSR(
            prev,
            next,
            frame,
            totalFrames,
            cuboidsSolutionRef,
            selectedId,
        );

        if (interpolatedPSR) {
            if (!cuboidsSolutionRef.current[frame]) cuboidsSolutionRef.current[frame] = {};
            if (!cuboidsSolutionRef.current[frame][selectedId]) {
                cuboidsSolutionRef.current[frame][selectedId] = { id: selectedId };
            }

            cuboidsSolutionRef.current[frame][selectedId].psr = interpolatedPSR;
        }
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
}) => {
    const id = mesh.name;
    const type = mesh.userData.label;
    const position = mesh.position.clone();
    const scale = mesh.scale.clone();
    const rotation = mesh.rotation.clone();

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
            },
        };

        if (existing) {
            Object.assign(existing, data);
        } else {
            cuboidsSolutionRef.current[frameIndex].push(data);
        }
    }
};
