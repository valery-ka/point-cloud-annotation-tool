import { memo, useCallback } from "react";

import { useEvent, useCuboids, useModeration, useFrames, useConfig } from "contexts";

import { CuboidItem } from "./CuboidItem";

import { TABS } from "constants";

export const CuboidsHtml = memo(() => {
    const { publish } = useEvent();
    const { isModerationJob } = useConfig();
    const { issues, isIssuesHidden } = useModeration();

    const { activeFrameIndex } = useFrames();
    const { cuboidsGeometriesRef, hoveredCuboid } = useCuboids();

    const getIssueId = useCallback(
        (mesh) => {
            const id = parseInt(mesh.name);

            const issueIndex = issues.findIndex((issue) => issue.id === id);

            return issueIndex;
        },
        [issues],
    );

    const getIssueIndexOnFrame = useCallback(
        (mesh) => {
            const id = parseInt(mesh.name);

            const frameIssues = issues.filter((issue) => issue.frame === activeFrameIndex);

            const issueIndex = frameIssues.findIndex(
                (issue) => issue.source === "object" && issue.id === id,
            );

            return issueIndex;
        },
        [issues, activeFrameIndex],
    );

    const getLabel = useCallback((mesh) => {
        const label = mesh.userData.label;
        return label;
    }, []);

    const getShowLabel = useCallback(
        (mesh) => {
            return mesh.name === hoveredCuboid;
        },
        [hoveredCuboid],
    );

    const openObjectsContextMenu = useCallback(
        (event, mesh) => {
            publish("editCuboidLabel", {
                event: event,
                cuboid: {
                    id: mesh.name,
                    label: mesh.userData.label,
                },
            });
        },
        [publish],
    );

    const getCuboidHasIssue = useCallback(
        (mesh) => {
            const id = parseInt(mesh.name);

            const hasIssue = issues.some((issue) => {
                if (issue.source === "object") {
                    return issue.id === id && issue.frame === activeFrameIndex;
                }
                return false;
            });

            return hasIssue;
        },
        [issues, activeFrameIndex],
    );

    const openModerationContextMenu = useCallback(
        (event, mesh) => {
            publish("openCuboidIssuesList", {
                event: event,
                cuboid: {
                    id: mesh.name,
                    position: mesh.position,
                },
            });
        },
        [publish],
    );

    const setActiveTab = useCallback(() => {
        publish("setActiveTab", TABS.MODERATION);
    }, [publish]);

    const getCuboidIssueHidden = useCallback(
        (mesh) => {
            const id = parseInt(mesh.name);

            const issue = issues.find(
                (issue) =>
                    issue.source === "object" &&
                    issue.id === id &&
                    issue.frame === activeFrameIndex,
            );

            return issue?.checked || issue?.resolved || isIssuesHidden;
        },
        [issues, activeFrameIndex, isIssuesHidden],
    );

    const getIssueWorkerHint = useCallback(
        (mesh) => {
            const id = parseInt(mesh.name);

            const issue = issues.find(
                (issue) =>
                    issue.source === "object" &&
                    issue.id === id &&
                    issue.frame === activeFrameIndex,
            );

            return issue?.workerHint || null;
        },
        [issues, activeFrameIndex],
    );

    return (
        <>
            {Object.values(cuboidsGeometriesRef.current).map((geometry, index) => {
                const mesh = geometry.cube.mesh;
                return (
                    <CuboidItem
                        key={index}
                        index={getIssueId(mesh)}
                        text={getIssueIndexOnFrame(mesh) + 1}
                        mesh={mesh}
                        label={getLabel(mesh)}
                        showLabel={getShowLabel(mesh)}
                        onLabelClick={(e) => openObjectsContextMenu(e, mesh)}
                        hasIssue={getCuboidHasIssue(mesh)}
                        onAddIssueClick={(e) => openModerationContextMenu(e, mesh)}
                        onIssueClick={setActiveTab}
                        issueHidden={getCuboidIssueHidden(mesh)}
                        issueHint={getIssueWorkerHint(mesh)}
                        publish={publish}
                        isModerationJob={isModerationJob}
                    />
                );
            })}
        </>
    );
});
