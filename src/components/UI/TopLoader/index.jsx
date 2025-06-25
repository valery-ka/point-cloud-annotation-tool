import React from "react";
import LoadingBar from "react-top-loading-bar";

import { useLoading } from "contexts";

export const TopLoader = () => {
    const { topLoaderBarRef, topLoaderLoadingProgress } = useLoading();

    const isLoading = topLoaderLoadingProgress.isLoading;

    return (
        <>
            {isLoading && (
                <LoadingBar
                    ref={topLoaderBarRef}
                    color="#008cffc4"
                    height={3}
                    shadowStyle={{ boxShadow: "none" }}
                />
            )}
        </>
    );
};
