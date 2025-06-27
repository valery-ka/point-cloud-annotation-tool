import { memo, useCallback } from "react";

import { useEvent, useCuboids, useModeration, useFrames } from "contexts";

import { SceneButton } from "../SceneButton";

import { TABS } from "constants";

export const CuboidsLabels = memo(() => {
    const { publish } = useEvent();
    const { issues, isIssuesHidden } = useModeration();
    const { activeFrameIndex } = useFrames();
    const { cuboidsGeometriesRef, hoveredCuboid } = useCuboids();

    const getPosition = useCallback((mesh) => {
        const position = mesh.position;
        const scale = mesh.scale;
        return [position.x, position.y, position.z + scale.z / 2];
    }, []);

    const getLabel = useCallback((mesh) => {
        const label = mesh.userData.label;
        return label;
    }, []);

    const getIsHidden = useCallback(
        (mesh) => {
            return mesh.name === hoveredCuboid;
        },
        [hoveredCuboid],
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

    const getIssueIndex = useCallback(
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

    const getIssueId = useCallback(
        (mesh) => {
            const id = parseInt(mesh.name);

            const issueIndex = issues.findIndex((issue) => issue.id === id);

            return issueIndex;
        },
        [issues],
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

    return (
        <>
            {Object.values(cuboidsGeometriesRef.current).map((geometry, index) => {
                const mesh = geometry.cube.mesh;
                return (
                    <SceneButton
                        isCuboid={true}
                        key={mesh.name || index}
                        index={getIssueIndex(mesh) + 1}
                        text={getLabel(mesh)}
                        position={getPosition(mesh)}
                        hidden={!getIsHidden(mesh)}
                        onClick={(e) => openObjectsContextMenu(e, mesh)}
                        onAddIssueClick={(e) => openModerationContextMenu(e, mesh)}
                        onCuboidIssueClick={setActiveTab}
                        cuboidHasIssue={getCuboidHasIssue(mesh)}
                        hint={getIssueWorkerHint(mesh)}
                        cuboidIssueHidden={!getCuboidIssueHidden(mesh)}
                        issueId={getIssueId(mesh)}
                    />
                );
            })}
        </>
    );
});
