import {
    BoxGeometry,
    MeshBasicMaterial,
    Color,
    EdgesGeometry,
    LineBasicMaterial,
    Vector3,
    BufferGeometry,
    Line,
    DoubleSide,
    Mesh,
    LineSegments,
    Euler,
    Matrix4,
} from "three";

import { LAYERS } from "constants";

export const createCubeGeometry = (color, position, scale, rotation) => {
    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial({
        color: new Color(color),
        transparent: true,
        opacity: 0.025,
        side: DoubleSide,
    });

    const cube = new Mesh(geometry, material);
    cube.position.set(...position);
    cube.scale.set(...scale);
    cube.rotation.set(...rotation);

    return {
        mesh: cube,
        cleanup: () => {
            geometry.dispose();
            material.dispose();
        },
    };
};

export const createEdgesGeometry = (cubeGeometry, color) => {
    const edgesGeometry = new EdgesGeometry(cubeGeometry);
    const edgesMaterial = new LineBasicMaterial({
        color: new Color(color),
        linewidth: 2,
    });

    const edges = new LineSegments(edgesGeometry, edgesMaterial);

    return {
        mesh: edges,
        cleanup: () => {
            edgesGeometry.dispose();
            edgesMaterial.dispose();
        },
    };
};

export const createArrowGeometry = (color) => {
    const ARROW_SIZE = 0.85;
    const Z_OFFSET = -0.5;

    const rawPoints = [
        [-0.5, 0],
        [-1, 1],
        [1, 0],
        [-1, -1],
        [-0.5, 0],
    ];

    const arrowPoints = rawPoints.map(([x, y]) => {
        const normalizedX = (x / 2) * ARROW_SIZE;
        const normalizedY = (y / 2) * ARROW_SIZE;
        return new Vector3(normalizedX, normalizedY, Z_OFFSET);
    });

    const arrowGeometry = new BufferGeometry().setFromPoints(arrowPoints);
    const arrowMaterial = new LineBasicMaterial({
        color: color,
    });

    const arrow = new Line(arrowGeometry, arrowMaterial);

    return {
        mesh: arrow,
        cleanup: () => {
            arrowGeometry.dispose();
            arrowMaterial.dispose();
        },
    };
};

export const extractPsrFromObject = (object3D) => {
    return {
        position: [object3D.position.x, object3D.position.y, object3D.position.z],
        scale: [object3D.scale.x, object3D.scale.y, object3D.scale.z],
        rotation: new Euler().setFromQuaternion(object3D.quaternion).toArray(),
    };
};

export const addCuboid = (scene, cuboid) => {
    const { label, color, position, scale, rotation } = cuboid;

    const cube = createCubeGeometry(color, position, scale, rotation);
    const edges = createEdgesGeometry(cube.mesh.geometry, color);
    const arrow = createArrowGeometry(color);

    cube.mesh.layers.set(LAYERS.SECONDARY);
    // edges.mesh.layers.set(LAYERS.SECONDARY);
    arrow.mesh.layers.set(LAYERS.SECONDARY);

    cube.mesh.add(edges.mesh);
    cube.mesh.add(arrow.mesh);

    cube.mesh.name = cuboid.id;
    cube.mesh.userData.color = color;
    cube.mesh.userData.label = label;

    scene.add(cube.mesh);

    return { cube, edges, arrow };
};

export const updateCuboid = (id, label, color, cuboidsGeometriesRef) => {
    for (const geometry of Object.values(cuboidsGeometriesRef.current)) {
        if (geometry?.cube?.mesh?.name === id) {
            cuboidsGeometriesRef.current[id].cube.mesh.material.color = new Color(color);
            cuboidsGeometriesRef.current[id].edges.mesh.material.color = new Color(color);
            cuboidsGeometriesRef.current[id].arrow.mesh.material.color = new Color(color);
            cuboidsGeometriesRef.current[id].cube.mesh.userData.color = color;
            cuboidsGeometriesRef.current[id].cube.mesh.userData.label = label;
        }
    }
};

export const removeCuboid = (scene, cuboid) => {
    const { cube, edges, arrow } = cuboid;

    scene.remove(cube.mesh);
    cube.cleanup();
    edges.cleanup();
    arrow.cleanup();
};

export const getPointsInsideCuboid = (positions, position, quaternion, scale) => {
    const matrix = new Matrix4().compose(position, quaternion, scale);
    const inverseMatrix = new Matrix4().copy(matrix).invert();

    const halfSize = new Vector3(0.5, 0.5, 0.5);
    const point = new Vector3();
    const localPoint = new Vector3();
    const insidePoints = [];

    for (let i = 0; i < positions.length; i += 3) {
        point.set(positions[i], positions[i + 1], positions[i + 2]);
        localPoint.copy(point).applyMatrix4(inverseMatrix);

        if (
            Math.abs(localPoint.x) <= halfSize.x &&
            Math.abs(localPoint.y) <= halfSize.y &&
            Math.abs(localPoint.z) <= halfSize.z
        ) {
            insidePoints.push(i / 3);
        }
    }

    return insidePoints;
};

export const getCuboidMeshPositionById = (cuboidsGeometriesRef, id) => {
    for (const geometry of Object.values(cuboidsGeometriesRef.current)) {
        if (geometry?.cube?.mesh?.name === id) {
            const position = geometry.cube.mesh.position;
            const scale = geometry.cube.mesh.scale;
            return [position.x, position.y, position.z - scale.z / 2];
        }
    }
};
