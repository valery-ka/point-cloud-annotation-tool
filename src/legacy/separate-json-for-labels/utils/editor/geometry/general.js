import {
    BufferGeometry,
    BufferAttribute,
    BoxGeometry,
    EdgesGeometry,
    LineBasicMaterial,
    LineSegments,
    Float32BufferAttribute,
    LineLoop,
} from "three";
import * as APP_CONSTANTS from "@constants";

const { CIRCLE_RULER_RADIUS } = APP_CONSTANTS;

export const rebuildGeometry = (geom) => {
    const geometry = new BufferGeometry();

    // const allowedAttributes = ["position", "intensity"];
    const allowedAttributes = ["position", "intensity", "label"];

    for (const key of allowedAttributes) {
        if (geom.attributes[key]) {
            const attrData = geom.attributes[key];
            const bufferAttribute = new BufferAttribute(
                attrData.array,
                attrData.itemSize,
                attrData.normalized,
            );
            geometry.setAttribute(key, bufferAttribute);
        }
    }

    if (geom.index) {
        geometry.setIndex(new BufferAttribute(geom.index.array, 1));
    }

    return geometry;
};

export const drawGlobalBox = (positions, scene, boundingBoxRef, isBoxActive) => {
    if (!isBoxActive) {
        if (boundingBoxRef.current) {
            scene.remove(boundingBoxRef.current);
            boundingBoxRef.current = null;
        }
        return;
    }

    const numPoints = positions.length / 3;
    if (numPoints === 0) return;

    let minX = Infinity,
        minY = Infinity,
        minZ = Infinity;
    let maxX = -Infinity,
        maxY = -Infinity,
        maxZ = -Infinity;

    for (let i = 0; i < numPoints; i++) {
        const idx = i * 3;
        const x = positions[idx];
        const y = positions[idx + 1];
        const z = positions[idx + 2];

        if (x >= 1e5) continue;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);

        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        maxZ = Math.max(maxZ, z);
    }

    if (minX === Infinity || minY === Infinity || minZ === Infinity) {
        if (boundingBoxRef.current) {
            scene.remove(boundingBoxRef.current);
            boundingBoxRef.current = null;
        }
        return;
    }

    const boxGeometry = new BoxGeometry(maxX - minX, maxY - minY, maxZ - minZ);

    const boxEdges = new EdgesGeometry(boxGeometry);
    const boxMaterial = new LineBasicMaterial({ color: 0x555555 });
    const boxMesh = new LineSegments(boxEdges, boxMaterial);

    boxMesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);

    if (boundingBoxRef.current) {
        scene.remove(boundingBoxRef.current);
    }

    scene.add(boxMesh);
    boundingBoxRef.current = boxMesh;
};

export const drawCircleRuler = (scene, circleRulerRef, isCircleRulerActive) => {
    if (!isCircleRulerActive) {
        circleRulerRef.current?.forEach((circle) => scene.remove(circle));
        circleRulerRef.current = [];
        return;
    }

    const radii = CIRCLE_RULER_RADIUS;
    const segments = 1024;

    if (circleRulerRef.current) {
        circleRulerRef.current.forEach((circle) => scene.remove(circle));
    }

    const circles = radii.map((radius) => {
        const positions = [];

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            positions.push(radius * Math.cos(angle), radius * Math.sin(angle), 0);
        }

        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

        const material = new LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.2,
        });

        const circle = new LineLoop(geometry, material);
        scene.add(circle);
        return circle;
    });

    circleRulerRef.current = circles;
};
