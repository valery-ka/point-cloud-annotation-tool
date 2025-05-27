import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiamond } from "@fortawesome/free-solid-svg-icons";

import { useFileManager, useFrames, useCuboids } from "contexts";
import { useFrameLaneMouseEvents, useClickOutsideBlur } from "hooks";

export const FrameSwitcherLane = ({ stopPlayback }) => {
    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();
    const { keyFramesIndices } = useCuboids();

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

    const { handleMouseDownLane } = useFrameLaneMouseEvents(frameLaneRef);

    return (
        <div className="frame-switcher-lane-frames" ref={frameLaneRef}>
            {Object.entries(laneMarks).map(([key, { value, isFirst, isModFive }]) => (
                <div
                    key={key}
                    className={`frame-switcher-frame-container ${
                        value === activeFrameIndex ? "selected" : ""
                    }`}
                    onMouseDown={(e) => {
                        stopPlayback();
                        handleMouseDownLane(e, value);
                    }}
                >
                    <div
                        className={`frame-switcher-frame ${
                            isFirst ? "first" : isModFive ? "mod-five" : ""
                        }`}
                    ></div>
                    <div className="frame-switcher-frame-text">
                        {keyFramesIndices.includes(value) && <FontAwesomeIcon icon={faDiamond} />}
                    </div>
                </div>
            ))}
        </div>
    );
};
