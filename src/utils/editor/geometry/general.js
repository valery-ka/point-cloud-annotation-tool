import {
    BufferGeometry,
    BufferAttribute,
    BoxGeometry,
    EdgesGeometry,
    LineBasicMaterial,
    LineSegments,
    Float32BufferAttribute,
    LineLoop,
    MeshBasicMaterial,
    Mesh,
    DoubleSide,
} from "three";
import * as APP_CONSTANTS from "constants";

const { CIRCLE_RULER_RADIUS, HIDDEN_POINT } = APP_CONSTANTS;

export const rebuildGeometry = (geom) => {
    const geometry = new BufferGeometry();

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

            if (key === "position") {
                const originalArray = new Float32Array(attrData.array);
                const originalBufferAttribute = new BufferAttribute(
                    originalArray,
                    attrData.itemSize,
                    attrData.normalized,
                );
                geometry.setAttribute("original", originalBufferAttribute);
            }
        }
    }

    if (geom.index) {
        geometry.setIndex(new BufferAttribute(geom.index.array, 1));
    }

    return geometry;
};

export const drawGlobalBox = (positions, scene, boundingBoxRef, isBoxActive) => {
    if (!positions) return;
    if (!isBoxActive) {
        if (boundingBoxRef.current) {
            scene.remove(boundingBoxRef.current);
            boundingBoxRef.current = null;
        }
        return;
    }

    if (positions.length === 0) return;

    let minX = Infinity,
        minY = Infinity,
        minZ = Infinity;
    let maxX = -Infinity,
        maxY = -Infinity,
        maxZ = -Infinity;

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        if (x >= HIDDEN_POINT) continue;

        const y = positions[i + 1];
        const z = positions[i + 2];

        minX = x < minX ? x : minX;
        maxX = x > maxX ? x : maxX;

        minY = y < minY ? y : minY;
        maxY = y > maxY ? y : maxY;

        minZ = z < minZ ? z : minZ;
        maxZ = z > maxZ ? z : maxZ;
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

export const drawFrustumMesh = (fovYRad, aspect, color = 0x0084ff) => {
    const near = 0.025;
    const far = 0.15;

    const nearHalfHeight = Math.tan(fovYRad / 2) * near;
    const nearHalfWidth = nearHalfHeight * aspect;

    const farHalfHeight = Math.tan(fovYRad / 2) * far;
    const farHalfWidth = farHalfHeight * aspect;

    const vertices = new Float32Array([
        -nearHalfWidth,
        -nearHalfHeight,
        near,
        nearHalfWidth,
        -nearHalfHeight,
        near,
        nearHalfWidth,
        nearHalfHeight,
        near,
        -nearHalfWidth,
        nearHalfHeight,
        near,

        -farHalfWidth,
        -farHalfHeight,
        far,
        farHalfWidth,
        -farHalfHeight,
        far,
        farHalfWidth,
        farHalfHeight,
        far,
        -farHalfWidth,
        farHalfHeight,
        far,
    ]);

    const indices = [
        0, 4, 1, 1, 4, 5, 1, 5, 2, 2, 5, 6, 2, 6, 3, 3, 6, 7, 3, 7, 0, 0, 7, 4, 0, 1, 2, 0, 2, 3, 4,
        6, 5, 4, 7, 6,
    ];

    const geometry = new BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute("position", new BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();

    const material = new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.25,
        side: DoubleSide,
    });

    return new Mesh(geometry, material);
};

export const drawWireframe = (geometry, color = 0x0084ff) => {
    const edges = new EdgesGeometry(geometry);
    const lineMaterial = new LineBasicMaterial({
        color,
        linewidth: 1,
        transparent: true,
        opacity: 0.75,
    });
    return new LineSegments(edges, lineMaterial);
};
