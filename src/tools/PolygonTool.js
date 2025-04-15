import SelectorTools from "./SelectorTools";

export default class PolygonTool extends SelectorTools {
    constructor(props) {
        super(props);
        this.startX = NaN;
        this.startY = NaN;

        document.addEventListener("keydown", this.confirmSelection.bind(this));
    }

    reset() {
        this.startX = NaN;
        this.startY = NaN;
        this.polygon.length = 0;
    }

    removeLastPoint() {
        this.polygon.pop();
    }

    checkDrawingStatus() {
        if (this.polygon.length < 3) {
            this.updateDrawingStatus(false);
            this.startX = NaN;
            this.startY = NaN;
            this.polygon.length = 0;
            this.clearHoveredPoint();
        }
    }

    handleMouseDown(ev) {
        if (ev.which === this.leftMouseButton) {
            var offsetX = ev.offsetX;
            var offsetY = ev.offsetY;
            if (!this.isDrawing) {
                this.updateDrawingStatus(true);

                this.getHoveredPoint();
                this.drawHoveredPoint();

                this.polygon.length = 0;
                this.startX = offsetX;
                this.startY = offsetY;

                for (let i = 0; i < 3; i++) {
                    this.pushPoint(this.startX, this.startY);
                }
            } else {
                this.pushPoint(offsetX, offsetY);
            }
        } else if (ev.which === this.rightMouseButton) {
            if (this.isDrawing && this.polygon.length > 2) {
                this.removeLastPoint();
                this.checkDrawingStatus();
                this.handleMouseMove(ev);
            }
        }
    }

    confirmSelection(ev) {
        if (!this.isDrawing) return;
        if (ev.key === "Enter" || ev.key === " ") {
            if (this.polygon.length > 3) {
                this.polygon.pop();
            }
            this.selectByPolygon(this.polygon);
            this.reset();
            this.updateDrawingStatus(false);
            this.canvasSelectionIsDirty = true;
            this.actions.requestSaveFrame();
        }
        this.clearHoveredPoint();
    }

    handleMouseMove(ev) {
        const offsetX = ev.offsetX;
        const offsetY = ev.offsetY;

        if (this.isDrawing) {
            this.polygon.pop();
            this.pushPoint(offsetX, offsetY);
            this.checkDrawingStatus();
        }

        this.canvasSelectionIsDirty = true;
    }
}
