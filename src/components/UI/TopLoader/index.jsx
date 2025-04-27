import React from "react";
import LoadingBar from "react-top-loading-bar";

import { useImages } from "contexts";

export const TopLoader = ({ loadingBarRef }) => {
    const { areImagesLoading } = useImages();

    return (
        <>
            {areImagesLoading && (
                <LoadingBar
                    ref={loadingBarRef}
                    color="#008cffc4"
                    height={3}
                    shadowStyle={{ boxShadow: "none" }}
                />
            )}
        </>
    );
};
