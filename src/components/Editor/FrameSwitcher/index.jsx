import React, { memo } from "react";

import { useFileManager } from "contexts";
import { useEventSubscriptions, useFrameSwitcher, usePlayback } from "hooks";

import { FrameSwitcherControls } from "./FrameSwitcherControls";
import { FrameSwitcherLane } from "./FrameSwitcherLane";

export const FrameSwitcher = memo(() => {
    const { pcdFiles } = useFileManager();

    const {
        isPlaying,
        isPlayCycle,
        playSpeed,
        handlePlay,
        handlePlayCycle,
        handlePlaySpeed,
        stopPlayback,
    } = usePlayback();

    const {
        handleGoToFirstFrame,
        handleGoToPreviousFrame,
        handleGoToNextFrame,
        handleGoToLastFrame,
    } = useFrameSwitcher(stopPlayback);

    useEventSubscriptions(
        handleGoToFirstFrame,
        handleGoToPreviousFrame,
        handlePlay,
        handleGoToNextFrame,
        handleGoToLastFrame,
        handlePlayCycle,
        handlePlaySpeed,
    );

    return pcdFiles.length < 2 ? null : (
        <div className="frame-switcher">
            <div className="frame-switcher-content">
                <div className="frame-switcher-head">
                    <div className="frame-switcher-lane-timeline">
                        <FrameSwitcherControls
                            playSpeed={playSpeed}
                            isPlaying={isPlaying}
                            isPlayCycle={isPlayCycle}
                        />
                        <FrameSwitcherLane stopPlayback={stopPlayback} />
                    </div>
                </div>
            </div>
        </div>
    );
});
