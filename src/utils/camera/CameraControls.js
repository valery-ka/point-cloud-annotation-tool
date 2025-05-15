import { Controls, Quaternion, Spherical, Vector2, Vector3, Plane, Ray, MathUtils } from "three";

const _changeEvent = { type: "change" };
const _startEvent = { type: "start" };
const _endEvent = { type: "end" };
const _ray = new Ray();
const _plane = new Plane();
const _TILT_LIMIT = Math.cos(70 * MathUtils.DEG2RAD);

const _v = new Vector3();
const _twoPI = 2 * Math.PI;

const _STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
};

const _EPS = 0.000001;

const rightButton = "rightButton";
const leftButton = "leftButton";
const mouseMove = "mouseMove";
const mousePressed = "mousePressed";

const pan = "pan";
const rotate = "rotate";
const idle = "idle";

var isPanning = false;
var isRotating = false;
var shiftIsPressed = false;

var isKeyPressed = {};
var isPanningActive = false;

class CameraControls extends Controls {
    constructor(object, domElement = null) {
        super(object, domElement);

        this.state = _STATE.NONE;

        // Set to false to disable this control
        this.enabled = true;

        // "target" sets the location of focus, where the object orbits around
        this.target = new Vector3();

        // Sets the 3D cursor (similar to Blender), from which the maxTargetRadius takes effect
        this.cursor = new Vector3();

        // How far you can dolly in and out ( PerspectiveCamera only )
        this.minDistance = 0;
        this.maxDistance = Infinity;

        // How far you can zoom in and out ( OrthographicCamera only )
        this.minZoom = 0;
        this.maxZoom = Infinity;

        // Limit camera target within a spherical area around the cursor
        this.minTargetRadius = 0;
        this.maxTargetRadius = Infinity;

        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians

        // How far you can orbit horizontally, upper and lower limits.
        // If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
        this.minAzimuthAngle = -Infinity; // radians
        this.maxAzimuthAngle = Infinity; // radians

        // Set to true to enable damping (inertia)
        // If damping is enabled, you must call controls.update() in your animation loop
        this.enableDamping = false;
        this.dampingFactor = 0.05;

        // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
        // Set to false to disable zooming
        this.enableZoom = true;
        this.zoomSpeed = 1.0;

        // Set to false to disable rotating
        this.enableRotate = true;
        this.rotateSpeed = 1.0;

        // Set to false to disable panning
        this.enablePan = true;
        this.panSpeed = 2.0;
        this.screenSpacePanning = false; // if false, pan orthogonal to world-space direction camera.up
        this.zoomToCursor = false;

        // Keyboard panning
        this.enabledKeys = true;
        this.keyPanSpeed = 10.0;
        this.keys = {
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            BOTTOM: 40,
            W: 87,
            A: 65,
            S: 83,
            D: 68,
        };

        // Set to true to automatically rotate around the target
        // If auto-rotate is enabled, you must call controls.update() in your animation loop
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0; // 30 seconds per orbit when fps is 60

        // Mouse buttons
        this.mouseButtons = {
            // Changed from using THREE.MOUSE enumeration to direct numerical values for mouse button states
            mousePressed: { leftButton: 0, middleButton: 1, rightButton: 2 },
            // Category for mouse movement states, indicating different actions during mouse move events
            mouseMove: { leftButton: 1, middleButton: 4, rightButton: 2 },
        };

        // Set to false to disable corresponding button or invert the buttons behaviour
        this.enabledButtons = {
            leftButton: true,
            rightButton: true,
            isInverted: false,
        };

        // for reset
        this.target0 = this.target.clone();
        this.position0 = this.object.position.clone();
        this.zoom0 = this.object.zoom;

        // internals

        this._lastPosition = new Vector3();
        this._lastQuaternion = new Quaternion();
        this._lastTargetPosition = new Vector3();

        // so camera.up is the orbit axis
        this._quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0));
        this._quatInverse = this._quat.clone().invert();

        // current position in spherical coordinates
        this._spherical = new Spherical();
        this._sphericalDelta = new Spherical();

        this._scale = 1;
        this._panOffset = new Vector3();

        this._rotateStart = new Vector2();
        this._rotateEnd = new Vector2();
        this._rotateDelta = new Vector2();

        this._panStart = new Vector2();
        this._panEnd = new Vector2();
        this._panDelta = new Vector2();

        this._dollyStart = new Vector2();
        this._dollyEnd = new Vector2();
        this._dollyDelta = new Vector2();

        this._dollyDirection = new Vector3();
        this._mouse = new Vector2();
        this._performCursorZoom = false;

        this._controlActive = false;

        // event listeners

        this._onMouseDown = onMouseDown.bind(this);
        this._onMouseUp = onMouseUp.bind(this);
        this._onMouseMove = onMouseMove.bind(this);
        this._onMouseWheel = onMouseWheel.bind(this);
        this._onMouseLeave = onMouseLeave.bind(this);
        this._onContextMenu = onContextMenu.bind(this);

        this._handleKeyDown = handleKeyDown.bind(this);
        this._handleKeyUp = handleKeyUp.bind(this);

        this._navigationTransform = this._navigationTransform.bind(this);
        this._isButtonsInverted = this._isButtonsInverted.bind(this);

        //

        if (this.domElement !== null) {
            this.connect();
        }

        this.update();
    }

    connect() {
        this.domElement.addEventListener("mousedown", this._onMouseDown, false);

        this.domElement.addEventListener("wheel", this._onMouseWheel, {
            passive: false,
        });

        document.addEventListener("mousemove", this._navigationTransform, false);
        document.addEventListener("mouseup", this._onMouseUp, false);
        document.addEventListener("mouseleave", this._onMouseLeave, false);

        document.addEventListener("contextmenu", this._onContextMenu);

        document.addEventListener("keydown", this._handleKeyDown);
        document.addEventListener("keyup", this._handleKeyUp);
    }

    disconnect() {
        this.domElement.removeEventListener("mousedown", this._onMouseDown, false);
        this.domElement.removeEventListener("wheel", this._onMouseWheel, {
            passive: false,
        });

        document.removeEventListener("mousemove", this._navigationTransform, false);
        document.removeEventListener("mouseup", this._onMouseUp, false);
        document.removeEventListener("mouseleave", this._onMouseLeave, false);

        document.removeEventListener("contextmenu", this._onContextMenu);

        document.removeEventListener("keydown", this._handleKeyDown);
        document.removeEventListener("keyup", this._handleKeyUp);
    }

    dispose() {
        this.disconnect();
    }

    getPolarAngle() {
        return this._spherical.phi;
    }

    getAzimuthalAngle() {
        return this._spherical.theta;
    }

    getDistance() {
        return this.object.position.distanceTo(this.target);
    }

    saveState() {
        this.target0.copy(this.target);
        this.position0.copy(this.object.position);
        this.zoom0 = this.object.zoom;
    }

    reset() {
        this.target.copy(this.target0);
        this.object.position.copy(this.position0);
        this.object.zoom = this.zoom0;

        this.object.updateProjectionMatrix();
        this.dispatchEvent(_changeEvent);

        this.update();

        this.state = _STATE.NONE;
    }

    update(deltaTime = null) {
        const position = this.object.position;

        _v.copy(position).sub(this.target);

        // rotate offset to "y-axis-is-up" space
        _v.applyQuaternion(this._quat);

        // angle from z-axis around y-axis
        this._spherical.setFromVector3(_v);

        if (this.autoRotate && this.state === _STATE.NONE) {
            this._rotateLeft(this._getAutoRotationAngle(deltaTime));
        }

        if (this.enableDamping) {
            this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor;
            this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor;
        } else {
            this._spherical.theta += this._sphericalDelta.theta;
            this._spherical.phi += this._sphericalDelta.phi;
        }

        // restrict theta to be between desired limits

        let min = this.minAzimuthAngle;
        let max = this.maxAzimuthAngle;

        if (isFinite(min) && isFinite(max)) {
            if (min < -Math.PI) min += _twoPI;
            else if (min > Math.PI) min -= _twoPI;

            if (max < -Math.PI) max += _twoPI;
            else if (max > Math.PI) max -= _twoPI;

            if (min <= max) {
                this._spherical.theta = Math.max(min, Math.min(max, this._spherical.theta));
            } else {
                this._spherical.theta =
                    this._spherical.theta > (min + max) / 2
                        ? Math.max(min, this._spherical.theta)
                        : Math.min(max, this._spherical.theta);
            }
        }

        // restrict phi to be between desired limits
        this._spherical.phi = Math.max(
            this.minPolarAngle,
            Math.min(this.maxPolarAngle, this._spherical.phi),
        );

        this._spherical.makeSafe();

        // move target to panned location

        if (this.enableDamping === true) {
            this.target.addScaledVector(this._panOffset, this.dampingFactor);
        } else {
            this.target.add(this._panOffset);
        }

        // Limit the target distance from the cursor to create a sphere around the center of interest
        this.target.sub(this.cursor);
        this.target.clampLength(this.minTargetRadius, this.maxTargetRadius);
        this.target.add(this.cursor);

        let zoomChanged = false;
        // adjust the camera position based on zoom only if we're not zooming to the cursor or if it's an ortho camera
        // we adjust zoom later in these cases
        if ((this.zoomToCursor && this._performCursorZoom) || this.object.isOrthographicCamera) {
            this._spherical.radius = this._clampDistance(this._spherical.radius);
        } else {
            const prevRadius = this._spherical.radius;
            this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale);
            zoomChanged = prevRadius != this._spherical.radius;
        }

        _v.setFromSpherical(this._spherical);

        // rotate offset back to "camera-up-vector-is-up" space
        _v.applyQuaternion(this._quatInverse);

        position.copy(this.target).add(_v);

        this.object.lookAt(this.target);

        if (this.enableDamping === true) {
            this._sphericalDelta.theta *= 1 - this.dampingFactor;
            this._sphericalDelta.phi *= 1 - this.dampingFactor;

            this._panOffset.multiplyScalar(1 - this.dampingFactor);
        } else {
            this._sphericalDelta.set(0, 0, 0);

            this._panOffset.set(0, 0, 0);
        }

        // adjust camera position
        if (this.zoomToCursor && this._performCursorZoom) {
            let newRadius = null;
            if (this.object.isPerspectiveCamera) {
                // move the camera down the pointer ray
                // this method avoids floating point error
                const prevRadius = _v.length();
                newRadius = this._clampDistance(prevRadius * this._scale);

                const radiusDelta = prevRadius - newRadius;
                this.object.position.addScaledVector(this._dollyDirection, radiusDelta);
                this.object.updateMatrixWorld();

                zoomChanged = !!radiusDelta;
            } else if (this.object.isOrthographicCamera) {
                // adjust the ortho camera position based on zoom changes
                const mouseBefore = new Vector3(this._mouse.x, this._mouse.y, 0);
                mouseBefore.unproject(this.object);

                const prevZoom = this.object.zoom;
                this.object.zoom = Math.max(
                    this.minZoom,
                    Math.min(this.maxZoom, this.object.zoom / this._scale),
                );
                this.object.updateProjectionMatrix();

                zoomChanged = prevZoom !== this.object.zoom;

                const mouseAfter = new Vector3(this._mouse.x, this._mouse.y, 0);
                mouseAfter.unproject(this.object);

                this.object.position.sub(mouseAfter).add(mouseBefore);
                this.object.updateMatrixWorld();

                newRadius = _v.length();
            } else {
                console.warn(
                    "WARNING: CameraControls.js encountered an unknown camera type - zoom to cursor disabled.",
                );
                this.zoomToCursor = false;
            }

            // handle the placement of the target
            if (newRadius !== null) {
                if (this.screenSpacePanning) {
                    // position the orbit target in front of the new camera position
                    this.target
                        .set(0, 0, -1)
                        .transformDirection(this.object.matrix)
                        .multiplyScalar(newRadius)
                        .add(this.object.position);
                } else {
                    // get the ray and translation plane to compute target
                    _ray.origin.copy(this.object.position);
                    _ray.direction.set(0, 0, -1).transformDirection(this.object.matrix);

                    // if the camera is 20 degrees above the horizon then don't adjust the focus target to avoid
                    // extremely large values
                    if (Math.abs(this.object.up.dot(_ray.direction)) < _TILT_LIMIT) {
                        this.object.lookAt(this.target);
                    } else {
                        _plane.setFromNormalAndCoplanarPoint(this.object.up, this.target);
                        _ray.intersectPlane(_plane, this.target);
                    }
                }
            }
        } else if (this.object.isOrthographicCamera) {
            const prevZoom = this.object.zoom;
            this.object.zoom = Math.max(
                this.minZoom,
                Math.min(this.maxZoom, this.object.zoom / this._scale),
            );

            if (prevZoom !== this.object.zoom) {
                this.object.updateProjectionMatrix();
                zoomChanged = true;
            }
        }

        this._scale = 1;
        this._performCursorZoom = false;

        // update condition is:
        // min(camera displacement, camera rotation in radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8

        if (
            zoomChanged ||
            this._lastPosition.distanceToSquared(this.object.position) > _EPS ||
            8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > _EPS ||
            this._lastTargetPosition.distanceToSquared(this.target) > _EPS
        ) {
            this.dispatchEvent(_changeEvent);

            this._lastPosition.copy(this.object.position);
            this._lastQuaternion.copy(this.object.quaternion);
            this._lastTargetPosition.copy(this.target);

            return true;
        }

        return false;
    }

    _getAutoRotationAngle(deltaTime) {
        if (deltaTime !== null) {
            return (_twoPI / 60) * this.autoRotateSpeed * deltaTime;
        } else {
            return (_twoPI / 60 / 60) * this.autoRotateSpeed;
        }
    }

    _getZoomScale(delta) {
        const normalizedDelta = Math.abs(delta * 0.01);
        return Math.pow(0.95, this.zoomSpeed * normalizedDelta);
    }

    _rotateLeft(angle) {
        this._sphericalDelta.theta -= angle;
    }

    _rotateUp(angle) {
        this._sphericalDelta.phi -= angle;
    }

    _panLeft(distance, objectMatrix) {
        _v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
        _v.multiplyScalar(-distance);

        this._panOffset.add(_v);
    }

    _panUp(distance, objectMatrix) {
        if (this.screenSpacePanning === true) {
            _v.setFromMatrixColumn(objectMatrix, 1);
        } else {
            _v.setFromMatrixColumn(objectMatrix, 0);
            _v.crossVectors(this.object.up, _v);
        }

        _v.multiplyScalar(distance);

        this._panOffset.add(_v);
    }

    // deltaX and deltaY are in pixels; right and down are positive
    _pan(deltaX, deltaY) {
        const element = this.domElement;

        if (this.object.isPerspectiveCamera) {
            // perspective
            const position = this.object.position;
            _v.copy(position).sub(this.target);
            let targetDistance = _v.length();

            // half of the fov is center to top of screen
            targetDistance *= Math.tan(((this.object.fov / 2) * Math.PI) / 180.0);

            // we use only clientHeight here so aspect ratio does not distort speed
            this._panLeft((2 * deltaX * targetDistance) / element.clientHeight, this.object.matrix);
            this._panUp((2 * deltaY * targetDistance) / element.clientHeight, this.object.matrix);
        } else if (this.object.isOrthographicCamera) {
            // orthographic
            this._panLeft(
                (deltaX * (this.object.right - this.object.left)) /
                    this.object.zoom /
                    element.clientWidth,
                this.object.matrix,
            );
            this._panUp(
                (deltaY * (this.object.top - this.object.bottom)) /
                    this.object.zoom /
                    element.clientHeight,
                this.object.matrix,
            );
        } else {
            // camera neither orthographic nor perspective
            console.warn(
                "WARNING: CameraControls.js encountered an unknown camera type - pan disabled.",
            );
            this.enablePan = false;
        }
    }

    _dollyOut(dollyScale) {
        if (this.object.isPerspectiveCamera || this.object.isOrthographicCamera) {
            this._scale /= dollyScale;
        } else {
            console.warn(
                "WARNING: CameraControls.js encountered an unknown camera type - dolly/zoom disabled.",
            );
            this.enableZoom = false;
        }
    }

    _dollyIn(dollyScale) {
        if (this.object.isPerspectiveCamera || this.object.isOrthographicCamera) {
            this._scale *= dollyScale;
        } else {
            console.warn(
                "WARNING: CameraControls.js encountered an unknown camera type - dolly/zoom disabled.",
            );
            this.enableZoom = false;
        }
    }

    _updateZoomParameters(x, y) {
        if (!this.zoomToCursor) {
            return;
        }

        this._performCursorZoom = true;

        const rect = this.domElement.getBoundingClientRect();
        const dx = x - rect.left;
        const dy = y - rect.top;
        const w = rect.width;
        const h = rect.height;

        this._mouse.x = (dx / w) * 2 - 1;
        this._mouse.y = -(dy / h) * 2 + 1;

        this._dollyDirection
            .set(this._mouse.x, this._mouse.y, 1)
            .unproject(this.object)
            .sub(this.object.position)
            .normalize();
    }

    _clampDistance(dist) {
        return Math.max(this.minDistance, Math.min(this.maxDistance, dist));
    }

    //
    // event callbacks - update the object state
    //

    _handleMouseDownPan(event) {
        if (!isPanning) {
            this._setNavigationMode(pan, event);
        }
    }

    _handleMouseDownRotate(event) {
        if (!isRotating) {
            this._setNavigationMode(rotate, event);
        }
    }

    _handleMouseMovePan(event) {
        if (isPanning) {
            this._panEnd.set(event.clientX, event.clientY);

            this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed);

            this._pan(this._panDelta.x, this._panDelta.y);

            this._panStart.copy(this._panEnd);

            this.update();
        }
    }

    _handleMouseMoveRotate(event) {
        if (isRotating) {
            this._rotateEnd.set(event.clientX, event.clientY);

            this._rotateDelta
                .subVectors(this._rotateEnd, this._rotateStart)
                .multiplyScalar(this.rotateSpeed);

            const element = this.domElement;

            this._rotateLeft((_twoPI * this._rotateDelta.x) / element.clientHeight); // yes, height

            this._rotateUp((_twoPI * this._rotateDelta.y) / element.clientHeight);

            this._rotateStart.copy(this._rotateEnd);

            this.update();
        }
    }

    _setNavigationMode(mode = idle, event) {
        if (mode === pan) {
            this._panStart.set(event.clientX, event.clientY);
            isPanning = true;
            isRotating = false;
        } else if (mode === rotate) {
            this._rotateStart.set(event.clientX, event.clientY);
            isRotating = true;
            isPanning = false;
        } else {
            isRotating = false;
            isPanning = false;
        }
    }

    _isButtonsInverted(button, action, event) {
        const isInverted = this.enabledButtons.isInverted;
        const actualButton = isInverted
            ? button === leftButton
                ? rightButton
                : leftButton
            : button;

        const buttonEnabled = this.enabledButtons[actualButton];
        const buttonState = this.mouseButtons[action][actualButton];

        if (action === mousePressed) {
            return buttonEnabled && event.button === buttonState;
        } else if (action === mouseMove) {
            return buttonEnabled && (event.buttons & buttonState) !== 0;
        }

        return false;
    }

    _navigationTransform(event) {
        if (this._isButtonsInverted.call(this, rightButton, mouseMove, event)) {
            if (event.shiftKey) {
                if (!shiftIsPressed) {
                    this._setNavigationMode(pan, event);
                }
                shiftIsPressed = true;
                this._handleMouseMovePan(event);
            } else {
                if (shiftIsPressed) {
                    this._setNavigationMode(rotate, event);
                }
                shiftIsPressed = false;
                this._handleMouseMoveRotate(event);
            }
        } else if (this._isButtonsInverted.call(this, leftButton, mouseMove, event)) {
            if (event.shiftKey) {
                if (!shiftIsPressed) {
                    this._setNavigationMode(rotate, event);
                }
                shiftIsPressed = true;
                this._handleMouseMoveRotate(event);
            } else {
                if (shiftIsPressed) {
                    this._setNavigationMode(pan, event);
                }
                shiftIsPressed = false;
                this._handleMouseMovePan(event);
            }
        }
    }

    _handleMouseWheel(event) {
        this._updateZoomParameters(event.clientX, event.clientY);

        if (event.deltaY < 0) {
            this._dollyIn(this._getZoomScale(event.deltaY));
        } else if (event.deltaY > 0) {
            this._dollyOut(this._getZoomScale(event.deltaY));
        }

        this.update();
    }

    _customWheelEvent(event) {
        const mode = event.deltaMode;

        // minimal wheel event altered to meet delta-zoom demand
        const newEvent = {
            clientX: event.clientX,
            clientY: event.clientY,
            deltaY: event.deltaY,
        };

        switch (mode) {
            case 1: // LINE_MODE
                newEvent.deltaY *= 16;
                break;

            case 2: // PAGE_MODE
                newEvent.deltaY *= 100;
                break;
        }

        return newEvent;
    }

    _keyPanning() {
        const { UP, W, BOTTOM, S, LEFT, A, RIGHT, D } = this.keys;

        if (isKeyPressed[UP] || isKeyPressed[W]) {
            this._pan(0, this.keyPanSpeed);
        }

        if (isKeyPressed[BOTTOM] || isKeyPressed[S]) {
            this._pan(0, -this.keyPanSpeed);
        }

        if (isKeyPressed[LEFT] || isKeyPressed[A]) {
            this._pan(this.keyPanSpeed, 0);
        }

        if (isKeyPressed[RIGHT] || isKeyPressed[D]) {
            this._pan(-this.keyPanSpeed, 0);
        }

        this.update();

        if (Object.values(isKeyPressed).some((pressed) => pressed)) {
            requestAnimationFrame(this._keyPanning.bind(this));
        } else {
            isPanningActive = false;
            this.dispatchEvent(_endEvent);
        }
    }
}

function onMouseDown(event) {
    if (this.enabled === false) return;

    event.preventDefault();

    shiftIsPressed = event.shiftKey;

    const isLeftButton = event.which === 1;
    const isRightButton = event.which === 3;

    if (
        (isLeftButton && !this.enabledButtons.leftButton) ||
        (isRightButton && !this.enabledButtons.rightButton)
    ) {
        return;
    }

    if (this._isButtonsInverted.call(this, rightButton, mousePressed, event)) {
        if (event.shiftKey) {
            this._handleMouseDownPan(event);
        } else {
            this._handleMouseDownRotate(event);
        }
    } else if (this._isButtonsInverted.call(this, leftButton, mousePressed, event)) {
        if (event.shiftKey) {
            this._handleMouseDownRotate(event);
        } else {
            this._handleMouseDownPan(event);
        }
    }

    this.dispatchEvent(_startEvent);
}

function onMouseMove(event) {
    if (this.enabled === false) return;

    event.preventDefault();

    this._navigationTransform(event);
}

function onMouseUp() {
    if (this.enabled === false) return;

    this._setNavigationMode(idle);

    if (isNonZeroVector(this._rotateStart) || isNonZeroVector(this._panStart)) {
        this.dispatchEvent(_endEvent);
    }

    this._rotateStart.set(0, 0);
    this._panStart.set(0, 0);

    this.state = _STATE.NONE;
}

function onMouseWheel(event) {
    if (event.ctrlKey === true) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }

    if (this.enabled === false || this.enableZoom === false || this.state !== _STATE.NONE) return;

    event.preventDefault();
    event.stopPropagation();

    this.dispatchEvent(_startEvent);

    this._handleMouseWheel(this._customWheelEvent(event));

    if (!isPanning || !isRotating) {
        this.dispatchEvent(_endEvent);
    }
}

function onMouseLeave(event) {
    if (this.enabled === false) return;

    this.state = _STATE.NONE;

    this._setNavigationMode(idle);

    if (isNonZeroVector(this._rotateStart) || isNonZeroVector(this._panStart)) {
        this.dispatchEvent(_endEvent);
    }

    this._rotateStart.set(0, 0);
    this._panStart.set(0, 0);
}

function isInputFocused() {
    const activeElement = document.activeElement;
    const tag = activeElement.tagName.toLowerCase();

    const isEditable = ["input", "div"].includes(tag) || activeElement.isContentEditable;

    const dialogOverlay = document.querySelector(".dialog-overlay");

    return !!(isEditable || dialogOverlay);
}

function handleKeyDown(event) {
    const stopPanning = isInputFocused();

    const isNavigationButton = Object.values(this.keys).includes(event.which);

    if (!this.enabledKeys || !isNavigationButton || !this.keyPanSpeed || stopPanning) return;

    event.preventDefault();

    if (!isKeyPressed[event.keyCode]) {
        isKeyPressed[event.keyCode] = true;

        if (!isPanningActive) {
            isPanningActive = true;
            this._keyPanning();
            this.dispatchEvent(_startEvent);
        }
    }
}

function handleKeyUp(event) {
    isKeyPressed[event.keyCode] = false;
}

function onContextMenu(event) {
    if (this.enabled === false) return;

    event.preventDefault();
}

function isNonZeroVector(vector) {
    return vector.x !== 0 || vector.y !== 0;
}

export { CameraControls };
