import { memo, useState, useEffect, useCallback } from "react";

import { useFrames, useCuboids } from "contexts";
import { useSaveSolution } from "hooks";

export const ObjectCardInfoAttributes = memo(({ title, attributes }) => {
    const { activeFrameIndex } = useFrames();
    const { selectedCuboid, cuboidsSolutionRef } = useCuboids();
    const { saveObjectsSolution } = useSaveSolution();

    const getCurrentAttributes = useCallback(() => {
        const solution = cuboidsSolutionRef.current;
        const activeFrameSolution = solution[activeFrameIndex];
        const selectedCuboidFrameSolution = activeFrameSolution?.find(
            (cuboid) => cuboid.id === selectedCuboid?.id,
        );
        return selectedCuboidFrameSolution?.attributes || [];
    }, [selectedCuboid, activeFrameIndex]);

    const [cuboidAttributes, setCuboidAttributes] = useState(getCurrentAttributes());

    // меняем аттрибут на текущем кадре
    const handleLeftButtonClick = useCallback(
        (attribute) => {
            const solution = cuboidsSolutionRef.current;
            const activeFrameSolution = solution[activeFrameIndex];

            const selectedCuboidFrameSolution = activeFrameSolution?.find(
                (cuboid) => cuboid.id === selectedCuboid?.id,
            );

            if (!selectedCuboidFrameSolution) return;

            const currentAttributes = getCurrentAttributes();
            const hasAttribute = currentAttributes.includes(attribute);

            const newAttributes = hasAttribute
                ? currentAttributes.filter((attr) => attr !== attribute)
                : [...currentAttributes, attribute];

            selectedCuboidFrameSolution.attributes = newAttributes;
            setCuboidAttributes(newAttributes);
            saveObjectsSolution({ updateStack: false, isAutoSave: false });
        },
        [selectedCuboid, activeFrameIndex, getCurrentAttributes, saveObjectsSolution],
    );

    // меняем аттрибут на всех кадрах (например, если тачка припаркована на всей сцене)
    const handleRightButtonClick = useCallback(
        (e, attribute) => {
            e.preventDefault();
            if (!selectedCuboid) return;

            const solution = cuboidsSolutionRef.current;
            const currentAttributes = getCurrentAttributes();

            const shouldAdd = !currentAttributes.includes(attribute);

            for (const frame of solution) {
                if (!frame) continue;

                const cuboidInFrame = frame.find((c) => c.id === selectedCuboid.id);
                if (!cuboidInFrame) continue;

                cuboidInFrame.attributes ??= [];
                const hasAttribute = cuboidInFrame.attributes.includes(attribute);

                if (shouldAdd === hasAttribute) continue;

                cuboidInFrame.attributes = shouldAdd
                    ? [...cuboidInFrame.attributes, attribute]
                    : cuboidInFrame.attributes.filter((a) => a !== attribute);
            }

            setCuboidAttributes((prev) =>
                shouldAdd ? [...prev, attribute] : prev.filter((a) => a !== attribute),
            );
            saveObjectsSolution({ updateStack: false, isAutoSave: false });
        },
        [selectedCuboid, getCurrentAttributes, saveObjectsSolution],
    );

    useEffect(() => {
        setCuboidAttributes(getCurrentAttributes());
    }, [selectedCuboid, activeFrameIndex, getCurrentAttributes]);

    return (
        <div className="object-card-info-block">
            <div className="object-card-info-block-title-container">
                <h3 className="object-card-info-block-title">{title}</h3>
            </div>
            <div className="object-card-info-buttons-group">
                {attributes?.map((attribute, index) => (
                    <div
                        key={index}
                        className={`object-card-info-button ${cuboidAttributes.includes(attribute) ? "pushed" : ""}`}
                        onClick={() => handleLeftButtonClick(attribute)}
                        onContextMenu={(e) => handleRightButtonClick(e, attribute)}
                    >
                        <div className="object-card-info-button-text">{attribute}</div>
                    </div>
                ))}
            </div>
        </div>
    );
});
