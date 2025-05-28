import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiamond, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

import { useFileManager, useFrames, useCuboids } from "contexts";
import { useFrameLaneMouseEvents, useClickOutsideBlur } from "hooks";

export const FrameSwitcherLane = ({ stopPlayback }) => {
    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();
    const { frameMarkers } = useCuboids();

    const [keyFramesIndices, visibilityIndices] = useMemo(() => {
        return [frameMarkers[0], frameMarkers[1]];
    }, [frameMarkers]);

    const frameLaneRef = useClickOutsideBlur();

    const laneMarks = useMemo(() => {
        return pcdFiles.reduce((acc, _, index) => {
            acc[index] = {
                value: index,
                isFirst: index === 0,
                isModFive: index % 5 === 0,
            };
            return acc;
        }, {});
    }, [pcdFiles]);

    const { handleMouseDownLane, removeKeyFrame } = useFrameLaneMouseEvents(frameLaneRef);

    return (
        <div className="frame-switcher-lane-frames" ref={frameLaneRef}>
            {Object.entries(laneMarks).map(([key, { value, isFirst, isModFive }]) => (
                <div
                    key={key}
                    className={`frame-switcher-frame-container ${
                        value === activeFrameIndex ? "selected" : ""
                    }`}
                    onPointerDown={(e) => {
                        stopPlayback();
                        handleMouseDownLane(e, value);
                    }}
                    onPointerUp={(e) => {
                        removeKeyFrame(e, value);
                    }}
                >
                    <div
                        className={`frame-switcher-frame ${
                            isFirst ? "first" : isModFive ? "mod-five" : ""
                        }`}
                    ></div>
                    <div className="frame-switcher-frame-text">
                        {visibilityIndices?.includes(value) ? (
                            <FontAwesomeIcon icon={faEyeSlash} />
                        ) : keyFramesIndices?.includes(value) ? (
                            <FontAwesomeIcon icon={faDiamond} />
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    );
};
