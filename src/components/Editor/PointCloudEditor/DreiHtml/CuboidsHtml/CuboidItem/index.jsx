import { memo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";

import { SceneButton } from "../../SceneButton";
import { CuboidIssue } from "../CuboidIssue";
import { CuboidLabel } from "../CuboidLabel";

const arePositionsEqual = (a, b) =>
    a && b && a.length === b.length && a.every((v, i) => v === b[i]);

export const CuboidItem = memo(
    ({
        index,
        text,
        mesh,
        label,
        showLabel,
        onLabelClick,
        hasIssue,
        onAddIssueClick,
        onIssueClick,
        issueHidden,
        issueHint,
        publish,
        isModerationJob,
    }) => {
        const [showHint, setShowHint] = useState(false);
        const [position, setPosition] = useState([0, 0, 0]);

        const getPosition = useCallback((mesh) => {
            const position = mesh.position;
            const scale = mesh.scale;
            return [position.x, position.y, position.z + scale.z / 2];
        }, []);

        useFrame(() => {
            const newPos = getPosition(mesh);
            setPosition((prev) => {
                if (!arePositionsEqual(prev, newPos)) {
                    return newPos;
                }
                return prev;
            });
        });

        return (
            <SceneButton position={position} setShowTooltip={setShowHint}>
                <>
                    <CuboidIssue
                        index={index}
                        text={text}
                        showAddIssueButton={showLabel}
                        hasIssue={hasIssue}
                        onAddIssueClick={onAddIssueClick}
                        onIssueClick={onIssueClick}
                        issueHidden={issueHidden}
                        issueHint={issueHint}
                        publish={publish}
                        isModerationJob={isModerationJob}
                        showHint={showHint}
                        setShowHint={setShowHint}
                    />
                    <CuboidLabel label={label} showLabel={showLabel} onLabelClick={onLabelClick} />
                </>
            </SceneButton>
        );
    },
);
