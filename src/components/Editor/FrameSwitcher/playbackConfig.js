export const playbackConfig = {
    speeds: {
        superSlow: { value: 400, label: "0.25x" },
        slow: { value: 200, label: "0.5x" },
        normal: { value: 100, label: "1x" },
        fast: { value: 50, label: "2x" },
        superFast: { value: 25, label: "4x" },
    },
    getNextSpeed: (currentSpeed) => {
        const speeds = Object.values(playbackConfig.speeds);
        const currentIndex = speeds.findIndex(speed => speed.value === currentSpeed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        return speeds[nextIndex].value;
    },
    getSpeedLabel: (speed) => {
        const speedEntry = Object.values(playbackConfig.speeds).find(s => s.value === speed);
        return speedEntry ? speedEntry.label : "1x";
    }
};