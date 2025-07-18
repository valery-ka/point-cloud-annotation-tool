import {
    BoxGeometry,
    BufferGeometry,
    CylinderGeometry,
    DoubleSide,
    Euler,
    Float32BufferAttribute,
    LineBasicMaterial,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    Color,
    PlaneGeometry,
    Quaternion,
    Raycaster,
    TorusGeometry,
    Vector3,
} from "three";

import { LAYERS } from "constants";

const _raycaster = new Raycaster();
_raycaster.layers.set(LAYERS.SECONDARY);

const _tempVector = new Vector3();
const _tempVector2 = new Vector3();
const _tempQuaternion = new Quaternion();
const _unit = {
    X: new Vector3(1, 0, 0),
    Y: new Vector3(0, 1, 0),
    Z: new Vector3(0, 0, 1),
};

const _changeEvent = { type: "change" };
const _mouseDownEvent = { type: "mouseDown" };
const _mouseUpEvent = { type: "mouseUp", mode: null };
const _objectChangeEvent = { type: "objectChange" };

class TransformControls extends Object3D {
    constructor(camera, domElement) {
        super();

        if (domElement === undefined) {
            console.warn(
                'THREE.TransformControls: The second parameter "domElement" is now mandatory.',
            );
            domElement = document;
        }

        this.visible = false;
        this.domElement = domElement;
        this.domElement.style.touchAction = "none"; // disable touch scroll

        const _gizmo = new TransformControlsGizmo();
        _gizmo.layers.set(LAYERS.SECONDARY);
        this._gizmo = _gizmo;
        this.add(_gizmo);

        const _plane = new TransformControlsPlane();
        _plane.layers.set(LAYERS.SECONDARY);
        this._plane = _plane;
        this.add(_plane);

        const scope = this;

        // Defined getter, setter and store for a property
        function defineProperty(propName, defaultValue) {
            let propValue = defaultValue;

            Object.defineProperty(scope, propName, {
                get: function () {
                    return propValue !== undefined ? propValue : defaultValue;
                },

                set: function (value) {
                    if (propValue !== value) {
                        propValue = value;
                        _plane[propName] = value;
                        _gizmo[propName] = value;

                        scope.dispatchEvent({ type: propName + "-changed", value: value });
                        scope.dispatchEvent(_changeEvent);
                    }
                },
            });

            scope[propName] = defaultValue;
            _plane[propName] = defaultValue;
            _gizmo[propName] = defaultValue;
        }

        // Define properties with getters/setter
        // Setting the defined property will automatically trigger change event
        // Defined properties are passed down to gizmo and plane

        defineProperty("camera", camera);
        defineProperty("object", undefined);
        defineProperty("enabled", true);
        defineProperty("axis", null);
        defineProperty("mode", "translate");
        defineProperty("translationSnap", null);
        defineProperty("rotationSnap", null);
        defineProperty("scaleSnap", null);
        defineProperty("space", "world");
        defineProperty("size", 1);
        defineProperty("dragging", false);
        defineProperty("showX", true);
        defineProperty("showY", true);
        defineProperty("showZ", true);

        // Reusable utility variables

        const worldPosition = new Vector3();
        const worldPositionStart = new Vector3();
        const worldQuaternion = new Quaternion();
        const worldQuaternionStart = new Quaternion();
        const cameraPosition = new Vector3();
        const cameraQuaternion = new Quaternion();
        const pointStart = new Vector3();
        const pointEnd = new Vector3();
        const rotationAxis = new Vector3();
        const rotationAngle = 0;
        const eye = new Vector3();

        // TODO: remove properties unused in plane and gizmo

        defineProperty("worldPosition", worldPosition);
        defineProperty("worldPositionStart", worldPositionStart);
        defineProperty("worldQuaternion", worldQuaternion);
        defineProperty("worldQuaternionStart", worldQuaternionStart);
        defineProperty("cameraPosition", cameraPosition);
        defineProperty("cameraQuaternion", cameraQuaternion);
        defineProperty("pointStart", pointStart);
        defineProperty("pointEnd", pointEnd);
        defineProperty("rotationAxis", rotationAxis);
        defineProperty("rotationAngle", rotationAngle);
        defineProperty("eye", eye);

        this._offset = new Vector3();
        this._startNorm = new Vector3();
        this._endNorm = new Vector3();
        this._cameraScale = new Vector3();

        this._parentPosition = new Vector3();
        this._parentQuaternion = new Quaternion();
        this._parentQuaternionInv = new Quaternion();
        this._parentScale = new Vector3();

        this._worldScaleStart = new Vector3();
        this._worldQuaternionInv = new Quaternion();
        this._worldScale = new Vector3();

        this._positionStart = new Vector3();
        this._quaternionStart = new Quaternion();
        this._scaleStart = new Vector3();

        this._getPointer = getPointer.bind(this);
        this._onPointerDown = onPointerDown.bind(this);
        this._onPointerHover = onPointerHover.bind(this);
        this._onPointerMove = onPointerMove.bind(this);
        this._onPointerUp = onPointerUp.bind(this);

        this.domElement.addEventListener("pointerdown", this._onPointerDown);
        this.domElement.addEventListener("pointermove", this._onPointerHover);
        this.domElement.addEventListener("pointerup", this._onPointerUp);
    }

    // updateMatrixWorld  updates key transformation variables
    updateMatrixWorld() {
        if (this.object !== undefined) {
            this.object.updateMatrixWorld();

            if (this.object.parent === null) {
                console.error(
                    "TransformControls: The attached 3D object must be a part of the scene graph.",
                );
            } else {
                this.object.parent.matrixWorld.decompose(
                    this._parentPosition,
                    this._parentQuaternion,
                    this._parentScale,
                );
            }

            this.object.matrixWorld.decompose(
                this.worldPosition,
                this.worldQuaternion,
                this._worldScale,
            );

            this._parentQuaternionInv.copy(this._parentQuaternion).invert();
            this._worldQuaternionInv.copy(this.worldQuaternion).invert();
        }

        this.camera.updateMatrixWorld();
        this.camera.matrixWorld.decompose(
            this.cameraPosition,
            this.cameraQuaternion,
            this._cameraScale,
        );

        this.eye.copy(this.cameraPosition).sub(this.worldPosition).normalize();

        super.updateMatrixWorld(this);
    }

    pointerHover(pointer) {
        if (this.object === undefined || this.dragging === true) return;

        _raycaster.setFromCamera(pointer, this.camera);

        const intersect = intersectObjectWithRay(this._gizmo.picker[this.mode], _raycaster);

        if (intersect) {
            this.axis = intersect.object.name;
        } else {
            this.axis = null;
        }
    }

    pointerDown(pointer) {
        if (this.object === undefined || this.dragging === true || pointer.button !== 0) return;

        if (this.axis !== null) {
            _raycaster.setFromCamera(pointer, this.camera);

            const planeIntersect = intersectObjectWithRay(this._plane, _raycaster, true);

            if (planeIntersect) {
                this.object.updateMatrixWorld();
                this.object.parent.updateMatrixWorld();

                this._positionStart.copy(this.object.position);
                this._quaternionStart.copy(this.object.quaternion);
                this._scaleStart.copy(this.object.scale);

                this.object.matrixWorld.decompose(
                    this.worldPositionStart,
                    this.worldQuaternionStart,
                    this._worldScaleStart,
                );

                this.pointStart.copy(planeIntersect.point).sub(this.worldPositionStart);
            }

            this.dragging = true;
            _mouseDownEvent.mode = this.mode;
            this.dispatchEvent(_mouseDownEvent);
        }
    }

    pointerMove(pointer) {
        const axis = this.axis;
        const mode = this.mode;
        const object = this.object;
        let space = this.space;

        if (mode === "scale") {
            space = "local";
        } else if (axis === "E" || axis === "XYZE" || axis === "XYZ") {
            space = "world";
        }

        if (
            object === undefined ||
            axis === null ||
            this.dragging === false ||
            pointer.button !== -1
        )
            return;

        _raycaster.setFromCamera(pointer, this.camera);

        const planeIntersect = intersectObjectWithRay(this._plane, _raycaster, true);

        if (!planeIntersect) return;

        this.pointEnd.copy(planeIntersect.point).sub(this.worldPositionStart);

        if (mode === "translate") {
            // Apply translate

            this._offset.copy(this.pointEnd).sub(this.pointStart);

            if (space === "local" && axis !== "XYZ") {
                this._offset.applyQuaternion(this._worldQuaternionInv);
            }

            if (axis.indexOf("X") === -1) this._offset.x = 0;
            if (axis.indexOf("Y") === -1) this._offset.y = 0;
            if (axis.indexOf("Z") === -1) this._offset.z = 0;

            if (space === "local" && axis !== "XYZ") {
                this._offset.applyQuaternion(this._quaternionStart).divide(this._parentScale);
            } else {
                this._offset.applyQuaternion(this._parentQuaternionInv).divide(this._parentScale);
            }

            object.position.copy(this._offset).add(this._positionStart);

            // Apply translation snap

            if (this.translationSnap) {
                if (space === "local") {
                    object.position.applyQuaternion(
                        _tempQuaternion.copy(this._quaternionStart).invert(),
                    );

                    if (axis.search("X") !== -1) {
                        object.position.x =
                            Math.round(object.position.x / this.translationSnap) *
                            this.translationSnap;
                    }

                    if (axis.search("Y") !== -1) {
                        object.position.y =
                            Math.round(object.position.y / this.translationSnap) *
                            this.translationSnap;
                    }

                    if (axis.search("Z") !== -1) {
                        object.position.z =
                            Math.round(object.position.z / this.translationSnap) *
                            this.translationSnap;
                    }

                    object.position.applyQuaternion(this._quaternionStart);
                }

                if (space === "world") {
                    if (object.parent) {
                        object.position.add(
                            _tempVector.setFromMatrixPosition(object.parent.matrixWorld),
                        );
                    }

                    if (axis.search("X") !== -1) {
                        object.position.x =
                            Math.round(object.position.x / this.translationSnap) *
                            this.translationSnap;
                    }

                    if (axis.search("Y") !== -1) {
                        object.position.y =
                            Math.round(object.position.y / this.translationSnap) *
                            this.translationSnap;
                    }

                    if (axis.search("Z") !== -1) {
                        object.position.z =
                            Math.round(object.position.z / this.translationSnap) *
                            this.translationSnap;
                    }

                    if (object.parent) {
                        object.position.sub(
                            _tempVector.setFromMatrixPosition(object.parent.matrixWorld),
                        );
                    }
                }
            }
        } else if (mode === "scale") {
            const SENSITIVITY = 1.0;
            const MIN_DIMENSION_SIZE = 0.1;

            const MIN_SCALE = new Vector3(
                MIN_DIMENSION_SIZE,
                MIN_DIMENSION_SIZE,
                MIN_DIMENSION_SIZE,
            );

            const deltaWorld = new Vector3().copy(this.pointEnd).sub(this.pointStart);
            const newScale = object.scale.clone();
            const scaleOffset = new Vector3();

            const directions = [
                { key: "posX", axis: new Vector3(1, 0, 0), sign: +1 },
                { key: "negX", axis: new Vector3(1, 0, 0), sign: -1 },
                { key: "posY", axis: new Vector3(0, 1, 0), sign: +1 },
                { key: "negY", axis: new Vector3(0, 1, 0), sign: -1 },
                { key: "posZ", axis: new Vector3(0, 0, 1), sign: +1 },
                { key: "negZ", axis: new Vector3(0, 0, 1), sign: -1 },
            ];

            directions.forEach(({ key, axis: localAxis, sign }) => {
                if (!axis.includes(key)) return;

                const worldAxis = localAxis.clone().applyQuaternion(object.quaternion).normalize();
                const projectedDelta = worldAxis.dot(deltaWorld);
                const scaleDelta = projectedDelta * SENSITIVITY * sign;

                const component = localAxis.x ? "x" : localAxis.y ? "y" : "z";

                const initialScale = this._scaleStart[component];
                const updated = Math.max(initialScale + scaleDelta, MIN_SCALE[component]);
                newScale[component] = updated;

                const delta = updated - initialScale;
                scaleOffset.add(worldAxis.clone().multiplyScalar(delta * 0.5 * sign));
            });

            object.scale.copy(newScale);
            object.position.copy(this._positionStart).add(scaleOffset);
        } else if (mode === "rotate") {
            this._offset.copy(this.pointEnd).sub(this.pointStart);

            const ROTATION_SPEED =
                5 /
                this.worldPosition.distanceTo(
                    _tempVector.setFromMatrixPosition(this.camera.matrixWorld),
                );

            if (axis === "E") {
                this.rotationAxis.copy(this.eye);
                this.rotationAngle = this.pointEnd.angleTo(this.pointStart);

                this._startNorm.copy(this.pointStart).normalize();
                this._endNorm.copy(this.pointEnd).normalize();

                this.rotationAngle *=
                    this._endNorm.cross(this._startNorm).dot(this.eye) < 0 ? 1 : -1;
            } else if (axis === "XYZE") {
                this.rotationAxis.copy(this._offset).cross(this.eye).normalize();
                this.rotationAngle =
                    this._offset.dot(_tempVector.copy(this.rotationAxis).cross(this.eye)) *
                    ROTATION_SPEED;
            } else if (axis === "X" || axis === "Y" || axis === "Z") {
                this.rotationAxis.copy(_unit[axis]);

                _tempVector.copy(_unit[axis]);

                if (space === "local") {
                    _tempVector.applyQuaternion(this.worldQuaternion);
                }

                this.rotationAngle =
                    this._offset.dot(_tempVector.cross(this.eye).normalize()) * ROTATION_SPEED;
            }

            // Apply rotation snap

            if (this.rotationSnap)
                this.rotationAngle =
                    Math.round(this.rotationAngle / this.rotationSnap) * this.rotationSnap;

            // Apply rotate
            if (space === "local" && axis !== "E" && axis !== "XYZE") {
                object.quaternion.copy(this._quaternionStart);
                object.quaternion
                    .multiply(
                        _tempQuaternion.setFromAxisAngle(this.rotationAxis, this.rotationAngle),
                    )
                    .normalize();
            } else {
                this.rotationAxis.applyQuaternion(this._parentQuaternionInv);
                object.quaternion.copy(
                    _tempQuaternion.setFromAxisAngle(this.rotationAxis, this.rotationAngle),
                );
                object.quaternion.multiply(this._quaternionStart).normalize();
            }
        }

        this.dispatchEvent(_changeEvent);
        this.dispatchEvent(_objectChangeEvent);
    }

    pointerUp(pointer) {
        if (pointer.button !== 0) return;

        if (this.dragging && this.axis !== null) {
            _mouseUpEvent.mode = this.mode;
            this.dispatchEvent(_mouseUpEvent);
        }

        this.dragging = false;
        this.axis = null;
    }

    dispose() {
        this.domElement.removeEventListener("pointerdown", this._onPointerDown);
        this.domElement.removeEventListener("pointermove", this._onPointerHover);
        this.domElement.removeEventListener("pointermove", this._onPointerMove);
        this.domElement.removeEventListener("pointerup", this._onPointerUp);

        this.traverse(function (child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    // Set current object
    attach(object) {
        this.object = object;
        this.visible = true;

        return this;
    }

    // Detatch from object
    detach() {
        this.object = undefined;
        this.visible = false;
        this.axis = null;

        return this;
    }

    getRaycaster() {
        return _raycaster;
    }

    // TODO: deprecate

    getMode() {
        return this.mode;
    }

    setMode(mode) {
        this.mode = mode;
    }

    setTranslationSnap(translationSnap) {
        this.translationSnap = translationSnap;
    }

    setRotationSnap(rotationSnap) {
        this.rotationSnap = rotationSnap;
    }

    setScaleSnap(scaleSnap) {
        this.scaleSnap = scaleSnap;
    }

    setSize(size) {
        this.size = size;
    }

    setSpace(space) {
        this.space = space;
    }

    update() {
        console.warn(
            "THREE.TransformControls: update function has no more functionality and therefore has been deprecated.",
        );
    }
}

TransformControls.prototype.isTransformControls = true;

// mouse / touch event handlers

function getPointer(event) {
    if (this.domElement.ownerDocument.pointerLockElement) {
        return {
            x: 0,
            y: 0,
            button: event.button,
        };
    } else {
        const rect = this.domElement.getBoundingClientRect();

        return {
            x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
            y: (-(event.clientY - rect.top) / rect.height) * 2 + 1,
            button: event.button,
        };
    }
}

function onPointerHover(event) {
    if (!this.enabled) return;

    switch (event.pointerType) {
        case "mouse":
        case "pen":
            this.pointerHover(this._getPointer(event));
            break;
    }
}

function onPointerDown(event) {
    if (!this.enabled) return;

    this.domElement.setPointerCapture(event.pointerId);

    this.domElement.addEventListener("pointermove", this._onPointerMove);

    this.pointerHover(this._getPointer(event));
    this.pointerDown(this._getPointer(event));
}

function onPointerMove(event) {
    if (!this.enabled) return;

    this.pointerMove(this._getPointer(event));
}

function onPointerUp(event) {
    if (!this.enabled) return;

    this.domElement.releasePointerCapture(event.pointerId);

    this.domElement.removeEventListener("pointermove", this._onPointerMove);

    this.pointerUp(this._getPointer(event));
}

function intersectObjectWithRay(object, raycaster, includeInvisible) {
    const allIntersections = raycaster.intersectObject(object, true);

    for (let i = 0; i < allIntersections.length; i++) {
        if (allIntersections[i].object.visible || includeInvisible) {
            return allIntersections[i];
        }
    }

    return false;
}

//

// Reusable utility variables

const _tempEuler = new Euler();
const _alignVector = new Vector3(0, 1, 0);
const _zeroVector = new Vector3(0, 0, 0);
const _lookAtMatrix = new Matrix4();
const _tempQuaternion2 = new Quaternion();
const _identityQuaternion = new Quaternion();
const _dirVector = new Vector3();
const _tempMatrix = new Matrix4();

const _unitX = new Vector3(1, 0, 0);
const _unitY = new Vector3(0, 1, 0);
const _unitZ = new Vector3(0, 0, 1);

const _v1 = new Vector3();
const _v2 = new Vector3();
const _v3 = new Vector3();

class TransformControlsGizmo extends Object3D {
    constructor() {
        super();

        this.isTransformControlsGizmo = true;

        this.type = "TransformControlsGizmo";

        // shared materials

        const gizmoMaterial = new MeshBasicMaterial({
            depthTest: false,
            depthWrite: false,
            fog: false,
            toneMapped: false,
            transparent: true,
        });

        const gizmoLineMaterial = new LineBasicMaterial({
            depthTest: false,
            depthWrite: false,
            fog: false,
            toneMapped: false,
            transparent: true,
        });

        const RED = "0xFF4C33";
        const GREEN = "0x33FF33";
        const BLUE = "0x334CFF";

        const CYAN = "0x33FFFF";
        const YELLOW = "0xFFFF33";
        const MAGENTA = "0xFF4CFF";

        const GRAY = "0x787878";

        // Make unique material for each axis/color

        const matInvisible = gizmoMaterial.clone();
        matInvisible.opacity = 0.15;

        const matHelper = gizmoLineMaterial.clone();
        matHelper.opacity = 0.5;

        const matRed = gizmoMaterial.clone();
        matRed.color.setHex(RED);

        const matGreen = gizmoMaterial.clone();
        matGreen.color.setHex(GREEN);

        const matBlue = gizmoMaterial.clone();
        matBlue.color.setHex(BLUE);

        const matCyan = gizmoMaterial.clone();
        matCyan.color.setHex(CYAN);
        matCyan.opacity = 0.5;

        const matYellow = gizmoMaterial.clone();
        matYellow.color.setHex(YELLOW);
        matYellow.opacity = 0.5;

        const matMagenta = gizmoMaterial.clone();
        matMagenta.color.setHex(MAGENTA);
        matMagenta.opacity = 0.5;

        const matRedTransparent = gizmoMaterial.clone();
        matRedTransparent.color.setHex(RED);
        matRedTransparent.opacity = 0.5;

        const matGreenTransparent = gizmoMaterial.clone();
        matGreenTransparent.color.setHex(GREEN);
        matGreenTransparent.opacity = 0.5;

        const matBlueTransparent = gizmoMaterial.clone();
        matBlueTransparent.color.setHex(BLUE);
        matBlueTransparent.opacity = 0.5;

        const matWhiteTransparent = gizmoMaterial.clone();
        matWhiteTransparent.opacity = 0.25;

        const matYellowTransparent = gizmoMaterial.clone();
        matYellowTransparent.color.setHex(YELLOW);
        matYellowTransparent.opacity = 0.25;

        const matGray = gizmoMaterial.clone();
        matGray.color.setHex(GRAY);

        // reusable geometry

        // Arrow geometry
        const ARROW_CONE_TOP_RADIUS = 0;
        const ARROW_CONE_BOTTOM_RADIUS = 0.02;
        const ARROW_CONE_HEIGHT = 0.1;
        const ARROW_CONE_SEGMENTS = 12;
        const ARROW_CONE_POSITION_OFFSET = 0.125;

        const arrowGeometry = new CylinderGeometry(
            ARROW_CONE_TOP_RADIUS,
            ARROW_CONE_BOTTOM_RADIUS,
            ARROW_CONE_HEIGHT,
            ARROW_CONE_SEGMENTS,
        );
        arrowGeometry.translate(0, ARROW_CONE_POSITION_OFFSET, 0);

        // Line geometry
        const LINE_CYLINDER_RADIUS = 0.004;
        const LINE_CYLINDER_HEIGHT = 0.4;
        const LINE_CYLINDER_SEGMENTS = 3;
        const LINE_CYLINDER_POSITION_OFFSET = 0.25;

        const lineGeometryMain = new CylinderGeometry(
            LINE_CYLINDER_RADIUS,
            LINE_CYLINDER_RADIUS,
            LINE_CYLINDER_HEIGHT,
            LINE_CYLINDER_SEGMENTS,
        );
        lineGeometryMain.translate(0, LINE_CYLINDER_POSITION_OFFSET, 0);

        // Scale handles
        const SCALE_HANDLE_WIDTH = 0.05;
        const SCALE_HANDLE_HEIGHT = SCALE_HANDLE_WIDTH;
        const SCALE_HANDLE_DEPTH = SCALE_HANDLE_WIDTH;
        const SCALE_HANDLE_POSITION_OFFSET = 0.05;

        const scaleHandleGeometry = new BoxGeometry(
            SCALE_HANDLE_WIDTH,
            SCALE_HANDLE_HEIGHT,
            SCALE_HANDLE_DEPTH,
        );
        scaleHandleGeometry.translate(0, SCALE_HANDLE_POSITION_OFFSET, 0);

        const lineGeometryHelperScale = new BufferGeometry();
        lineGeometryHelperScale.setAttribute(
            "position",
            new Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3),
        );

        function CircleGeometry(radius, arc, tube = 0.004) {
            const geometry = new TorusGeometry(radius, tube, 3, 64, arc * Math.PI * 2);
            geometry.rotateY(Math.PI / 2);
            geometry.rotateX((3 * Math.PI) / 4);
            return geometry;
        }

        function RotationArrow(
            axis,
            radius,
            arc,
            color,
            isStartArrow = true,
            top = 0,
            bottom = 0.02,
            height = 0.1,
        ) {
            const geometry = new CylinderGeometry(top, bottom, height, 12);
            const arrow = new Mesh(geometry, color);

            const angle = isStartArrow ? arc * Math.PI * 2 : arc * Math.PI * 2;

            switch (axis) {
                case "X":
                    geometry.rotateX(-Math.PI / 2);
                    break;
                case "Y":
                    geometry.rotateX(-Math.PI / 2);
                    break;
                case "Z":
                    geometry.rotateZ(Math.PI / 2);
                    break;
            }

            switch (axis) {
                case "X":
                    arrow.rotation.x = isStartArrow ? angle : Math.PI + angle;
                    arrow.position.y = radius * Math.cos(angle);
                    arrow.position.z = radius * Math.sin(angle);
                    break;

                case "Y":
                    arrow.position.x = radius * Math.cos(angle);
                    arrow.rotation.y = isStartArrow ? -angle : Math.PI - angle;
                    arrow.position.z = radius * Math.sin(angle);
                    break;

                case "Z":
                    arrow.position.x = radius * Math.sin(angle);
                    arrow.position.y = radius * Math.cos(angle);
                    arrow.rotation.z = isStartArrow ? -angle : Math.PI - angle;
                    break;
            }

            return arrow;
        }

        // Special geometry for transform helper. If scaled with position vector it spans from [0,0,0] to position

        function TranslateHelperGeometry() {
            const geometry = new BufferGeometry();

            geometry.setAttribute("position", new Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3));

            return geometry;
        }

        // Gizmo definitions - custom hierarchy definitions for setupGizmo() function

        // Gizmo constants
        const GIZMO_ARROW_LENGTH = 0.35;
        const GIZMO_PLANE_SIZE = 0.1;
        const GIZMO_PLANE_OFFSET = GIZMO_PLANE_SIZE / 2 + 0.05;
        const GIZMO_PLANE_THICKNESS = 0.001;

        const gizmoTranslate = {
            X: [
                [new Mesh(arrowGeometry, matRed), [GIZMO_ARROW_LENGTH, 0, 0], [0, 0, -Math.PI / 2]],
                [new Mesh(lineGeometryMain, matRed), [0, 0, 0], [0, 0, -Math.PI / 2]],
            ],
            Y: [
                [new Mesh(arrowGeometry, matGreen), [0, GIZMO_ARROW_LENGTH, 0]],
                [new Mesh(lineGeometryMain, matGreen)],
            ],
            Z: [
                [new Mesh(arrowGeometry, matBlue), [0, 0, GIZMO_ARROW_LENGTH], [Math.PI / 2, 0, 0]],
                [new Mesh(lineGeometryMain, matBlue), null, [Math.PI / 2, 0, 0]],
            ],
            XY: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matYellow.clone(),
                    ),
                    [GIZMO_PLANE_OFFSET, GIZMO_PLANE_OFFSET, 0],
                ],
            ],
            YZ: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matCyan.clone(),
                    ),
                    [0, GIZMO_PLANE_OFFSET, GIZMO_PLANE_OFFSET],
                    [0, Math.PI / 2, 0],
                ],
            ],
            XZ: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matMagenta.clone(),
                    ),
                    [GIZMO_PLANE_OFFSET, 0, GIZMO_PLANE_OFFSET],
                    [-Math.PI / 2, 0, 0],
                ],
            ],
        };

        // Picker constants
        const PICKER_CYLINDER_RADIUS = 0.05;
        const PICKER_CYLINDER_HEIGHT = LINE_CYLINDER_HEIGHT * 1.1;
        const PICKER_CYLINDER_SEGMENTS = 4;
        const PICKER_CYLINDER_OFFSET = 0.35;
        const PICKER_PLANE_SIZE = GIZMO_PLANE_SIZE + 0.1;
        const PICKER_PLANE_THICKNESS = 0.01;

        const pickerTranslate = {
            X: [
                [
                    new Mesh(
                        new CylinderGeometry(
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_HEIGHT,
                            PICKER_CYLINDER_SEGMENTS,
                        ),
                        matInvisible,
                    ),
                    [PICKER_CYLINDER_OFFSET, 0, 0],
                    [0, 0, -Math.PI / 2],
                ],
            ],
            Y: [
                [
                    new Mesh(
                        new CylinderGeometry(
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_HEIGHT,
                            PICKER_CYLINDER_SEGMENTS,
                        ),
                        matInvisible,
                    ),
                    [0, PICKER_CYLINDER_OFFSET, 0],
                ],
            ],
            Z: [
                [
                    new Mesh(
                        new CylinderGeometry(
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_HEIGHT,
                            PICKER_CYLINDER_SEGMENTS,
                        ),
                        matInvisible,
                    ),
                    [0, 0, PICKER_CYLINDER_OFFSET],
                    [Math.PI / 2, 0, 0],
                ],
            ],
            XY: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [GIZMO_PLANE_OFFSET, GIZMO_PLANE_OFFSET, 0],
                ],
            ],
            YZ: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [0, GIZMO_PLANE_OFFSET, GIZMO_PLANE_OFFSET],
                    [0, Math.PI / 2, 0],
                ],
            ],
            XZ: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [GIZMO_PLANE_OFFSET, 0, GIZMO_PLANE_OFFSET],
                    [-Math.PI / 2, 0, 0],
                ],
            ],
        };

        const helperTranslate = {
            // START: [
            //     [new Mesh(new OctahedronGeometry(0.01, 2), matHelper), null, null, null, "helper"],
            // ],
            // END: [
            //     [new Mesh(new OctahedronGeometry(0.01, 2), matHelper), null, null, null, "helper"],
            // ],
            // DELTA: [[new Line(TranslateHelperGeometry(), matHelper), null, null, null, "helper"]],
        };

        // Rotation constants
        const ROTATION_ARC = 0.25;
        const ROTATION_RADIUS = 0.4;
        const ROTATION_PICKER_THICKNESS = 0.05;
        const ROTATION_ARROW_WIDTH = 0.04;
        const ROTATION_ARROW_HEIGHT = 0.2;

        // Gizmo rotation
        const gizmoRotate = {
            X: [
                [RotationArrow("X", ROTATION_RADIUS, ROTATION_ARC * 0.5, matRed, true)],
                [new Mesh(CircleGeometry(ROTATION_RADIUS, ROTATION_ARC), matRed)],
                [RotationArrow("X", ROTATION_RADIUS, ROTATION_ARC * 1.5, matRed, false)],
            ],
            Y: [
                [RotationArrow("Y", ROTATION_RADIUS, ROTATION_ARC * 0.5, matGreen, true)],
                [
                    new Mesh(CircleGeometry(ROTATION_RADIUS, ROTATION_ARC), matGreen),
                    null,
                    [0, 0, -Math.PI / 2],
                ],
                [RotationArrow("Y", ROTATION_RADIUS, ROTATION_ARC * 1.5, matGreen, false)],
            ],
            Z: [
                [RotationArrow("Z", ROTATION_RADIUS, ROTATION_ARC * 0.5, matBlue, true)],
                [
                    new Mesh(CircleGeometry(ROTATION_RADIUS, ROTATION_ARC), matBlue),
                    null,
                    [0, Math.PI / 2, 0],
                ],
                [RotationArrow("Z", ROTATION_RADIUS, ROTATION_ARC * 1.5, matBlue, false)],
            ],
        };

        // Picker rotation
        const pickerRotate = {
            X: [
                [
                    RotationArrow(
                        "X",
                        ROTATION_RADIUS,
                        ROTATION_ARC * 0.5,
                        matInvisible,
                        true,
                        0,
                        ROTATION_ARROW_WIDTH,
                        ROTATION_ARROW_HEIGHT,
                    ),
                ],
                [
                    new Mesh(
                        CircleGeometry(ROTATION_RADIUS, ROTATION_ARC, ROTATION_PICKER_THICKNESS),
                        matInvisible,
                    ),
                ],
                [
                    RotationArrow(
                        "X",
                        ROTATION_RADIUS,
                        ROTATION_ARC * 1.5,
                        matInvisible,
                        false,
                        0,
                        ROTATION_ARROW_WIDTH,
                        ROTATION_ARROW_HEIGHT,
                    ),
                ],
            ],
            Y: [
                [
                    RotationArrow(
                        "Y",
                        ROTATION_RADIUS,
                        ROTATION_ARC * 0.5,
                        matInvisible,
                        true,
                        0,
                        ROTATION_ARROW_WIDTH,
                        ROTATION_ARROW_HEIGHT,
                    ),
                ],
                [
                    new Mesh(
                        CircleGeometry(ROTATION_RADIUS, ROTATION_ARC, ROTATION_PICKER_THICKNESS),
                        matInvisible,
                    ),
                    null,
                    [0, 0, -Math.PI / 2],
                ],
                [
                    RotationArrow(
                        "Y",
                        ROTATION_RADIUS,
                        ROTATION_ARC * 1.5,
                        matInvisible,
                        false,
                        0,
                        ROTATION_ARROW_WIDTH,
                        ROTATION_ARROW_HEIGHT,
                    ),
                ],
            ],
            Z: [
                [
                    RotationArrow(
                        "Z",
                        ROTATION_RADIUS,
                        ROTATION_ARC * 0.5,
                        matInvisible,
                        true,
                        0,
                        ROTATION_ARROW_WIDTH,
                        ROTATION_ARROW_HEIGHT,
                    ),
                ],
                [
                    new Mesh(
                        CircleGeometry(ROTATION_RADIUS, ROTATION_ARC, ROTATION_PICKER_THICKNESS),
                        matInvisible,
                    ),
                    null,
                    [0, Math.PI / 2, 0],
                ],
                [
                    RotationArrow(
                        "Z",
                        ROTATION_RADIUS,
                        ROTATION_ARC * 1.5,
                        matInvisible,
                        false,
                        0,
                        ROTATION_ARROW_WIDTH,
                        ROTATION_ARROW_HEIGHT,
                    ),
                ],
            ],
        };

        const helperRotate = {
            // AXIS: [
            //     [
            //         new Line(lineGeometryHelperScale, matHelper.clone()),
            //         [-1e3, 0, 0],
            //         null,
            //         [1e6, 1, 1],
            //         "helper",
            //     ],
            // ],
        };

        function createScaleGizmo(geometry, material) {
            return new Mesh(geometry.clone(), material.clone());
        }

        const gizmoScale = {
            posX: [
                [createScaleGizmo(lineGeometryMain, matRed), [0, 0, 0], [0, 0, -Math.PI / 2]],
                [createScaleGizmo(scaleHandleGeometry, matRed), [0.4, 0, 0], [0, 0, -Math.PI / 2]],
            ],
            posY: [
                [createScaleGizmo(lineGeometryMain, matGreen)],
                [createScaleGizmo(scaleHandleGeometry, matGreen), [0, 0.4, 0]],
            ],
            posZ: [
                [createScaleGizmo(lineGeometryMain, matBlue), [0, 0, 0], [Math.PI / 2, 0, 0]],
                [createScaleGizmo(scaleHandleGeometry, matBlue), [0, 0, 0.4], [Math.PI / 2, 0, 0]],
            ],
            negX: [
                [createScaleGizmo(lineGeometryMain, matRed), [0, 0, 0], [0, 0, Math.PI / 2]],
                [createScaleGizmo(scaleHandleGeometry, matRed), [-0.4, 0, 0], [0, 0, Math.PI / 2]],
            ],
            negY: [
                [createScaleGizmo(lineGeometryMain, matGreen), [0, 0, 0], [0, 0, Math.PI]],
                [createScaleGizmo(scaleHandleGeometry, matGreen), [0, -0.4, 0], [0, 0, Math.PI]],
            ],
            negZ: [
                [createScaleGizmo(lineGeometryMain, matBlue), [0, 0, 0], [-Math.PI / 2, 0, 0]],
                [
                    createScaleGizmo(scaleHandleGeometry, matBlue),
                    [0, 0, -0.4],
                    [-Math.PI / 2, 0, 0],
                ],
            ],
            posXposY: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matYellow.clone(),
                    ),
                    [GIZMO_PLANE_OFFSET, GIZMO_PLANE_OFFSET, 0],
                ],
            ],
            posYposZ: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matCyan.clone(),
                    ),
                    [0, GIZMO_PLANE_OFFSET, GIZMO_PLANE_OFFSET],
                    [0, Math.PI / 2, 0],
                ],
            ],
            posXposZ: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matMagenta.clone(),
                    ),
                    [GIZMO_PLANE_OFFSET, 0, GIZMO_PLANE_OFFSET],
                    [-Math.PI / 2, 0, 0],
                ],
            ],
            posXnegY: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matYellow.clone(),
                    ),
                    [GIZMO_PLANE_OFFSET, -GIZMO_PLANE_OFFSET, 0],
                ],
            ],
            negXposY: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matYellow.clone(),
                    ),
                    [-GIZMO_PLANE_OFFSET, GIZMO_PLANE_OFFSET, 0],
                ],
            ],
            negXnegY: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matYellow.clone(),
                    ),
                    [-GIZMO_PLANE_OFFSET, -GIZMO_PLANE_OFFSET, 0],
                ],
            ],
            posYnegZ: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matCyan.clone(),
                    ),
                    [0, GIZMO_PLANE_OFFSET, -GIZMO_PLANE_OFFSET],
                    [0, Math.PI / 2, 0],
                ],
            ],
            negYposZ: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matCyan.clone(),
                    ),
                    [0, -GIZMO_PLANE_OFFSET, GIZMO_PLANE_OFFSET],
                    [0, Math.PI / 2, 0],
                ],
            ],
            negYnegZ: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matCyan.clone(),
                    ),
                    [0, -GIZMO_PLANE_OFFSET, -GIZMO_PLANE_OFFSET],
                    [0, Math.PI / 2, 0],
                ],
            ],
            posXnegZ: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matMagenta.clone(),
                    ),
                    [GIZMO_PLANE_OFFSET, 0, -GIZMO_PLANE_OFFSET],
                    [-Math.PI / 2, 0, 0],
                ],
            ],
            negXposZ: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matMagenta.clone(),
                    ),
                    [-GIZMO_PLANE_OFFSET, 0, GIZMO_PLANE_OFFSET],
                    [-Math.PI / 2, 0, 0],
                ],
            ],
            negXnegZ: [
                [
                    new Mesh(
                        new BoxGeometry(GIZMO_PLANE_SIZE, GIZMO_PLANE_SIZE, GIZMO_PLANE_THICKNESS),
                        matMagenta.clone(),
                    ),
                    [-GIZMO_PLANE_OFFSET, 0, -GIZMO_PLANE_OFFSET],
                    [-Math.PI / 2, 0, 0],
                ],
            ],
        };

        const pickerScale = {
            posX: [
                [
                    new Mesh(
                        new CylinderGeometry(
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_HEIGHT,
                            PICKER_CYLINDER_SEGMENTS,
                        ),
                        matInvisible,
                    ),
                    [PICKER_CYLINDER_OFFSET, 0, 0],
                    [0, 0, -Math.PI / 2],
                ],
            ],
            posY: [
                [
                    new Mesh(
                        new CylinderGeometry(
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_HEIGHT,
                            PICKER_CYLINDER_SEGMENTS,
                        ),
                        matInvisible,
                    ),
                    [0, PICKER_CYLINDER_OFFSET, 0],
                ],
            ],
            posZ: [
                [
                    new Mesh(
                        new CylinderGeometry(
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_HEIGHT,
                            PICKER_CYLINDER_SEGMENTS,
                        ),
                        matInvisible,
                    ),
                    [0, 0, PICKER_CYLINDER_OFFSET],
                    [Math.PI / 2, 0, 0],
                ],
            ],
            negX: [
                [
                    new Mesh(
                        new CylinderGeometry(
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_HEIGHT,
                            PICKER_CYLINDER_SEGMENTS,
                        ),
                        matInvisible,
                    ),
                    [-PICKER_CYLINDER_OFFSET, 0, 0],
                    [0, 0, Math.PI / 2],
                ],
            ],
            negY: [
                [
                    new Mesh(
                        new CylinderGeometry(
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_HEIGHT,
                            PICKER_CYLINDER_SEGMENTS,
                        ),
                        matInvisible,
                    ),
                    [0, -PICKER_CYLINDER_OFFSET, 0],
                    [0, 0, Math.PI],
                ],
            ],
            negZ: [
                [
                    new Mesh(
                        new CylinderGeometry(
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_RADIUS,
                            PICKER_CYLINDER_HEIGHT,
                            PICKER_CYLINDER_SEGMENTS,
                        ),
                        matInvisible,
                    ),
                    [0, 0, -PICKER_CYLINDER_OFFSET],
                    [-Math.PI / 2, 0, 0],
                ],
            ],
            posXposY: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [GIZMO_PLANE_OFFSET, GIZMO_PLANE_OFFSET, 0],
                ],
            ],
            posYposZ: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [0, GIZMO_PLANE_OFFSET, GIZMO_PLANE_OFFSET],
                    [0, Math.PI / 2, 0],
                ],
            ],
            posXposZ: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [GIZMO_PLANE_OFFSET, 0, GIZMO_PLANE_OFFSET],
                    [-Math.PI / 2, 0, 0],
                ],
            ],
            posXnegY: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [GIZMO_PLANE_OFFSET, -GIZMO_PLANE_OFFSET, 0],
                ],
            ],
            negXposY: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [-GIZMO_PLANE_OFFSET, GIZMO_PLANE_OFFSET, 0],
                ],
            ],
            negXnegY: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [-GIZMO_PLANE_OFFSET, -GIZMO_PLANE_OFFSET, 0],
                ],
            ],
            posYnegZ: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [0, GIZMO_PLANE_OFFSET, -GIZMO_PLANE_OFFSET],
                    [0, Math.PI / 2, 0],
                ],
            ],
            negYposZ: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [0, -GIZMO_PLANE_OFFSET, GIZMO_PLANE_OFFSET],
                    [0, Math.PI / 2, 0],
                ],
            ],
            negYnegZ: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [0, -GIZMO_PLANE_OFFSET, -GIZMO_PLANE_OFFSET],
                    [0, Math.PI / 2, 0],
                ],
            ],
            posXnegZ: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [GIZMO_PLANE_OFFSET, 0, -GIZMO_PLANE_OFFSET],
                    [-Math.PI / 2, 0, 0],
                ],
            ],
            negXposZ: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [-GIZMO_PLANE_OFFSET, 0, GIZMO_PLANE_OFFSET],
                    [-Math.PI / 2, 0, 0],
                ],
            ],
            negXnegZ: [
                [
                    new Mesh(
                        new BoxGeometry(
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_SIZE,
                            PICKER_PLANE_THICKNESS,
                        ),
                        matInvisible,
                    ),
                    [-GIZMO_PLANE_OFFSET, 0, -GIZMO_PLANE_OFFSET],
                    [-Math.PI / 2, 0, 0],
                ],
            ],
        };

        const helperScale = {
            // X: [
            //     [
            //         new Line(lineGeometryHelperScale, matHelper.clone()),
            //         [-1e3, 0, 0],
            //         null,
            //         [1e6, 1, 1],
            //         "helper",
            //     ],
            // ],
            // Y: [
            //     [
            //         new Line(lineGeometryHelperScale, matHelper.clone()),
            //         [0, -1e3, 0],
            //         [0, 0, Math.PI / 2],
            //         [1e6, 1, 1],
            //         "helper",
            //     ],
            // ],
            // Z: [
            //     [
            //         new Line(lineGeometryHelperScale, matHelper.clone()),
            //         [0, 0, -1e3],
            //         [0, -Math.PI / 2, 0],
            //         [1e6, 1, 1],
            //         "helper",
            //     ],
            // ],
        };

        // Creates an Object3D with gizmos described in custom hierarchy definition.

        function setupGizmo(gizmoMap) {
            const gizmo = new Object3D();

            for (const name in gizmoMap) {
                for (let i = gizmoMap[name].length; i--; ) {
                    const object = gizmoMap[name][i][0].clone();
                    const position = gizmoMap[name][i][1];
                    const rotation = gizmoMap[name][i][2];
                    const scale = gizmoMap[name][i][3];
                    const tag = gizmoMap[name][i][4];

                    // name and tag properties are essential for picking and updating logic.
                    object.name = name;
                    object.tag = tag;

                    if (position) {
                        object.position.set(position[0], position[1], position[2]);
                    }

                    if (rotation) {
                        object.rotation.set(rotation[0], rotation[1], rotation[2]);
                    }

                    if (scale) {
                        object.scale.set(scale[0], scale[1], scale[2]);
                    }

                    object.updateMatrix();

                    const tempGeometry = object.geometry.clone();
                    tempGeometry.applyMatrix4(object.matrix);
                    object.geometry = tempGeometry;
                    object.renderOrder = Infinity;

                    object.position.set(0, 0, 0);
                    object.rotation.set(0, 0, 0);
                    object.scale.set(1, 1, 1);
                    object.layers.set(LAYERS.SECONDARY);

                    gizmo.add(object);
                }
            }

            return gizmo;
        }

        // Gizmo creation

        this.gizmo = {};
        this.picker = {};
        this.helper = {};

        this.add((this.gizmo["translate"] = setupGizmo(gizmoTranslate)));
        this.add((this.gizmo["rotate"] = setupGizmo(gizmoRotate)));
        this.add((this.gizmo["scale"] = setupGizmo(gizmoScale)));
        this.add((this.picker["translate"] = setupGizmo(pickerTranslate)));
        this.add((this.picker["rotate"] = setupGizmo(pickerRotate)));
        this.add((this.picker["scale"] = setupGizmo(pickerScale)));
        this.add((this.helper["translate"] = setupGizmo(helperTranslate)));
        this.add((this.helper["rotate"] = setupGizmo(helperRotate)));
        this.add((this.helper["scale"] = setupGizmo(helperScale)));

        // Pickers should be hidden always

        this.picker["translate"].visible = false;
        this.picker["rotate"].visible = false;
        this.picker["scale"].visible = false;
    }

    // updateMatrixWorld will update transformations and appearance of individual handles

    updateMatrixWorld(force) {
        const space = this.mode === "scale" ? "local" : this.space; // scale always oriented to local rotation

        const quaternion = space === "local" ? this.worldQuaternion : _identityQuaternion;

        // Show only gizmos for current transform mode

        this.gizmo["translate"].visible = this.mode === "translate";
        this.gizmo["rotate"].visible = this.mode === "rotate";
        this.gizmo["scale"].visible = this.mode === "scale";

        this.helper["translate"].visible = this.mode === "translate";
        this.helper["rotate"].visible = this.mode === "rotate";
        this.helper["scale"].visible = this.mode === "scale";

        let handles = [];
        handles = handles.concat(this.picker[this.mode].children);
        handles = handles.concat(this.gizmo[this.mode].children);
        handles = handles.concat(this.helper[this.mode].children);

        for (let i = 0; i < handles.length; i++) {
            const handle = handles[i];

            // hide aligned to camera

            handle.visible = true;
            handle.rotation.set(0, 0, 0);
            handle.position.copy(this.worldPosition);

            let factor;

            if (this.camera.isOrthographicCamera) {
                factor = (this.camera.top - this.camera.bottom) / this.camera.zoom;
            } else {
                factor =
                    this.worldPosition.distanceTo(this.cameraPosition) *
                    Math.min(
                        (1.9 * Math.tan((Math.PI * this.camera.fov) / 360)) / this.camera.zoom,
                        7,
                    );
            }

            handle.scale.set(1, 1, 1).multiplyScalar((factor * this.size) / 4);

            // TODO: simplify helpers and consider decoupling from gizmo

            if (handle.tag === "helper") {
                handle.visible = false;

                if (handle.name === "AXIS") {
                    handle.visible = !!this.axis;

                    if (this.axis === "X") {
                        _tempQuaternion.setFromEuler(_tempEuler.set(0, 0, 0));
                        handle.quaternion.copy(quaternion).multiply(_tempQuaternion);

                        if (
                            Math.abs(
                                _alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this.eye),
                            ) > 0.9
                        ) {
                            handle.visible = false;
                        }
                    }

                    if (this.axis === "Y") {
                        _tempQuaternion.setFromEuler(_tempEuler.set(0, 0, Math.PI / 2));
                        handle.quaternion.copy(quaternion).multiply(_tempQuaternion);

                        if (
                            Math.abs(
                                _alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this.eye),
                            ) > 0.9
                        ) {
                            handle.visible = false;
                        }
                    }

                    if (this.axis === "Z") {
                        _tempQuaternion.setFromEuler(_tempEuler.set(0, Math.PI / 2, 0));
                        handle.quaternion.copy(quaternion).multiply(_tempQuaternion);

                        if (
                            Math.abs(
                                _alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this.eye),
                            ) > 0.9
                        ) {
                            handle.visible = false;
                        }
                    }

                    if (this.axis === "XYZE") {
                        _tempQuaternion.setFromEuler(_tempEuler.set(0, Math.PI / 2, 0));
                        _alignVector.copy(this.rotationAxis);
                        handle.quaternion.setFromRotationMatrix(
                            _lookAtMatrix.lookAt(_zeroVector, _alignVector, _unitY),
                        );
                        handle.quaternion.multiply(_tempQuaternion);
                        handle.visible = this.dragging;
                    }

                    if (this.axis === "E") {
                        handle.visible = false;
                    }
                } else if (handle.name === "START") {
                    handle.position.copy(this.worldPositionStart);
                    handle.visible = this.dragging;
                } else if (handle.name === "END") {
                    handle.position.copy(this.worldPosition);
                    handle.visible = this.dragging;
                } else if (handle.name === "DELTA") {
                    handle.position.copy(this.worldPositionStart);
                    handle.quaternion.copy(this.worldQuaternionStart);
                    _tempVector
                        .set(1e-10, 1e-10, 1e-10)
                        .add(this.worldPositionStart)
                        .sub(this.worldPosition)
                        .multiplyScalar(-1);
                    _tempVector.applyQuaternion(this.worldQuaternionStart.clone().invert());
                    handle.scale.copy(_tempVector);
                    handle.visible = this.dragging;
                } else {
                    handle.quaternion.copy(quaternion);

                    if (this.dragging) {
                        handle.position.copy(this.worldPositionStart);
                    } else {
                        handle.position.copy(this.worldPosition);
                    }

                    if (this.axis) {
                        handle.visible = this.axis.search(handle.name) !== -1;
                    }
                }

                // If updating helper, skip rest of the loop
                continue;
            }

            // Align handles to current local or world rotation

            handle.quaternion.copy(quaternion);

            if (this.mode === "translate") {
                const AXIS_HIDE_THRESHOLD = 0.99;
                const PLANE_HIDE_THRESHOLD = 0.2;
                const AXIS_INVERT_THRESHOLD = 0;

                const xDot = _alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this.eye);
                const yDot = _alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this.eye);
                const zDot = _alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this.eye);

                const scaleFactor = (factor * this.size) / 4;

                if (handle.name === "X") {
                    if (Math.abs(xDot) > AXIS_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    } else if (xDot < AXIS_INVERT_THRESHOLD) {
                        handle.scale.set(-1, 1, 1).multiplyScalar(scaleFactor);
                    } else {
                        handle.scale.set(1, 1, 1).multiplyScalar(scaleFactor);
                    }
                }

                if (handle.name === "Y") {
                    if (Math.abs(yDot) > AXIS_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    } else if (yDot < AXIS_INVERT_THRESHOLD) {
                        handle.scale.set(1, -1, 1).multiplyScalar(scaleFactor);
                    } else {
                        handle.scale.set(1, 1, 1).multiplyScalar(scaleFactor);
                    }
                }

                if (handle.name === "Z") {
                    if (Math.abs(zDot) > AXIS_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    } else if (zDot < AXIS_INVERT_THRESHOLD) {
                        handle.scale.set(1, 1, -1).multiplyScalar(scaleFactor);
                    } else {
                        handle.scale.set(1, 1, 1).multiplyScalar(scaleFactor);
                    }
                }

                if (handle.name === "XY") {
                    if (Math.abs(zDot) < PLANE_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    } else {
                        const xSign = xDot < AXIS_INVERT_THRESHOLD ? -1 : 1;
                        const ySign = yDot < AXIS_INVERT_THRESHOLD ? -1 : 1;
                        handle.scale.set(xSign, ySign, 1).multiplyScalar(scaleFactor);
                    }
                }

                if (handle.name === "YZ") {
                    if (Math.abs(xDot) < PLANE_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    } else {
                        const ySign = yDot < AXIS_INVERT_THRESHOLD ? -1 : 1;
                        const zSign = zDot < AXIS_INVERT_THRESHOLD ? -1 : 1;
                        handle.scale.set(1, ySign, zSign).multiplyScalar(scaleFactor);
                    }
                }

                if (handle.name === "XZ") {
                    if (Math.abs(yDot) < PLANE_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    } else {
                        const xSign = xDot < AXIS_INVERT_THRESHOLD ? -1 : 1;
                        const zSign = zDot < AXIS_INVERT_THRESHOLD ? -1 : 1;
                        handle.scale.set(xSign, 1, zSign).multiplyScalar(scaleFactor);
                    }
                }
            } else if (this.mode === "scale") {
                const AXIS_HIDE_THRESHOLD = 0.99;
                const PLANE_SHOW_THRESHOLD = 0.2;

                const xDot = _alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this.eye);
                const yDot = _alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this.eye);
                const zDot = _alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this.eye);

                const scaleFactor = (factor * this.size) / 4;

                if (handle.name === "X" || handle.name === "posX" || handle.name === "negX") {
                    if (Math.abs(xDot) > AXIS_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    } else {
                        handle.scale.set(1, 1, 1).multiplyScalar(scaleFactor);
                    }
                }

                if (handle.name === "Y" || handle.name === "posY" || handle.name === "negY") {
                    if (Math.abs(yDot) > AXIS_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    } else {
                        handle.scale.set(1, 1, 1).multiplyScalar(scaleFactor);
                    }
                }

                if (handle.name === "Z" || handle.name === "posZ" || handle.name === "negZ") {
                    if (Math.abs(zDot) > AXIS_HIDE_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    } else {
                        handle.scale.set(1, 1, 1).multiplyScalar(scaleFactor);
                    }
                }

                if (
                    handle.name === "XY" ||
                    handle.name === "posXposY" ||
                    handle.name === "posXnegY" ||
                    handle.name === "negXposY" ||
                    handle.name === "negXnegY"
                ) {
                    if (Math.abs(zDot) < PLANE_SHOW_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    } else {
                        handle.scale.set(1, 1, 1).multiplyScalar(scaleFactor);
                    }
                }

                if (
                    handle.name === "YZ" ||
                    handle.name === "posYposZ" ||
                    handle.name === "posYnegZ" ||
                    handle.name === "negYposZ" ||
                    handle.name === "negYnegZ"
                ) {
                    if (Math.abs(xDot) < PLANE_SHOW_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    } else {
                        handle.scale.set(1, 1, 1).multiplyScalar(scaleFactor);
                    }
                }

                if (
                    handle.name === "XZ" ||
                    handle.name === "posXposZ" ||
                    handle.name === "posXnegZ" ||
                    handle.name === "negXposZ" ||
                    handle.name === "negXnegZ"
                ) {
                    if (Math.abs(yDot) < PLANE_SHOW_THRESHOLD) {
                        handle.scale.set(1e-10, 1e-10, 1e-10);
                        handle.visible = false;
                    } else {
                        handle.scale.set(1, 1, 1).multiplyScalar(scaleFactor);
                    }
                }
            } else if (this.mode === "rotate") {
                // Align handles to current local or world rotation

                _tempQuaternion2.copy(quaternion);
                _alignVector
                    .copy(this.eye)
                    .applyQuaternion(_tempQuaternion.copy(quaternion).invert());

                if (handle.name === "X") {
                    _tempQuaternion.setFromAxisAngle(
                        _unitX,
                        Math.atan2(-_alignVector.y, _alignVector.z),
                    );
                    _tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion);
                    handle.quaternion.copy(_tempQuaternion);
                }

                if (handle.name === "Y") {
                    _tempQuaternion.setFromAxisAngle(
                        _unitY,
                        Math.atan2(_alignVector.x, _alignVector.z),
                    );
                    _tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion);
                    handle.quaternion.copy(_tempQuaternion);
                }

                if (handle.name === "Z") {
                    _tempQuaternion.setFromAxisAngle(
                        _unitZ,
                        Math.atan2(_alignVector.y, _alignVector.x),
                    );
                    _tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion);
                    handle.quaternion.copy(_tempQuaternion);
                }
            }

            // Hide disabled axes
            handle.visible = handle.visible && (handle.name.indexOf("X") === -1 || this.showX);
            handle.visible = handle.visible && (handle.name.indexOf("Y") === -1 || this.showY);
            handle.visible = handle.visible && (handle.name.indexOf("Z") === -1 || this.showZ);
            handle.visible =
                handle.visible &&
                (handle.name.indexOf("E") === -1 || (this.showX && this.showY && this.showZ));

            // highlight selected axis

            handle.material._color = handle.material._color || handle.material.color.clone();
            handle.material._opacity = handle.material._opacity || handle.material.opacity;

            handle.material.color.copy(handle.material._color);
            handle.material.opacity = handle.material._opacity;

            if (this.enabled && this.axis) {
                if (handle.name === this.axis) {
                    if (!handle.userData.originalColor) {
                        handle.userData.originalColor = handle.material.color.clone();
                    }
                    const lightenFactor = 0.3;
                    handle.material.color.lerp(new Color(0xffffff), lightenFactor);
                    handle.material.opacity = 1.0;
                }
            }
        }

        super.updateMatrixWorld(force);
    }
}

TransformControlsGizmo.prototype.isTransformControlsGizmo = true;

//

class TransformControlsPlane extends Mesh {
    constructor() {
        super(
            new PlaneGeometry(100000, 100000, 2, 2),
            new MeshBasicMaterial({
                visible: false,
                wireframe: true,
                side: DoubleSide,
                transparent: true,
                opacity: 0.25,
                toneMapped: false,
            }),
        );

        this.isTransformControlsPlane = true;

        this.type = "TransformControlsPlane";
    }

    updateMatrixWorld(force) {
        let space = this.space;

        this.position.copy(this.worldPosition);

        if (this.mode === "scale") space = "local"; // scale always oriented to local rotation

        _v1.copy(_unitX).applyQuaternion(
            space === "local" ? this.worldQuaternion : _identityQuaternion,
        );
        _v2.copy(_unitY).applyQuaternion(
            space === "local" ? this.worldQuaternion : _identityQuaternion,
        );
        _v3.copy(_unitZ).applyQuaternion(
            space === "local" ? this.worldQuaternion : _identityQuaternion,
        );

        // Align the plane for current transform mode, axis and space.

        _alignVector.copy(_v2);

        switch (this.mode) {
            case "translate":
                switch (this.axis) {
                    case "X":
                        _alignVector.copy(this.eye).cross(_v1);
                        _dirVector.copy(_v1).cross(_alignVector);
                        break;
                    case "Y":
                        _alignVector.copy(this.eye).cross(_v2);
                        _dirVector.copy(_v2).cross(_alignVector);
                        break;
                    case "Z":
                        _alignVector.copy(this.eye).cross(_v3);
                        _dirVector.copy(_v3).cross(_alignVector);
                        break;
                    case "XY":
                        _dirVector.copy(_v3);
                        break;
                    case "YZ":
                        _dirVector.copy(_v1);
                        break;
                    case "XZ":
                        _alignVector.copy(_v3);
                        _dirVector.copy(_v2);
                        break;
                    case "XYZ":
                    case "E":
                        _dirVector.set(0, 0, 0);
                        break;
                }

                break;
            case "rotate":
            case "scale":
            default:
                // reset dir for rotate and scale
                _dirVector.set(0, 0, 0);
        }

        if (_dirVector.length() === 0) {
            // If in rotate mode, make the plane parallel to camera
            this.quaternion.copy(this.cameraQuaternion);
        } else {
            _tempMatrix.lookAt(_tempVector.set(0, 0, 0), _dirVector, _alignVector);

            this.quaternion.setFromRotationMatrix(_tempMatrix);
        }

        super.updateMatrixWorld(force);
    }
}

TransformControlsPlane.prototype.isTransformControlsPlane = true;

export { TransformControls, TransformControlsGizmo, TransformControlsPlane };
