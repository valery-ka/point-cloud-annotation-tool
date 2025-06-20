import { memo, useCallback, useMemo } from "react";
import {
    faClose,
    faTrash,
    faAngleDoubleLeft,
    faAngleDoubleRight,
    faTruck,
    faTrailer,
} from "@fortawesome/free-solid-svg-icons";

import { useEvent, useCuboids } from "contexts";
import { useSubscribeFunction } from "hooks";

import { SidebarIcon } from "../../SidebarIcon";

import { getCuboidMeshPositionById } from "utils/cuboids";

// const COMPONENT_NAME = "ObjectCardButtons.";
const COMPONENT_NAME = "";
const OBJECTS_TAB_INDEX = 0;

export const ObjectCardButtons = memo(() => {
    const { publish } = useEvent();
    const { cuboids, selectedCuboid, setSelectedCuboid, cuboidsGeometriesRef } = useCuboids();

    const { isPrevButtonActive, isNextButtonActive } = useMemo(() => {
        if (!selectedCuboid?.id || cuboids.length === 0) {
            return { isPrevButtonActive: false, isNextButtonActive: false };
        }

        const sorted = [...cuboids].sort((a, b) => Number(a.id) - Number(b.id));
        const index = sorted.findIndex((c) => c.id === selectedCuboid.id);

        return {
            isPrevButtonActive: index > 0,
            isNextButtonActive: index >= 0 && index < sorted.length - 1,
        };
    }, [selectedCuboid?.id, cuboids]);

    const prevCuboid = useCallback(() => {
        if (!selectedCuboid?.id) return;

        const sorted = [...cuboids].sort((a, b) => Number(a.id) - Number(b.id));
        const index = sorted.findIndex((c) => c.id === selectedCuboid.id);

        if (index > 0) {
            const prevCuboid = sorted[index - 1];
            const target = getCuboidMeshPositionById(cuboidsGeometriesRef, prevCuboid.id);
            publish("switchCameraToPoint", target);
            setSelectedCuboid(prevCuboid);
        }
    }, [selectedCuboid?.id, cuboids]);

    useSubscribeFunction("prevCuboid", prevCuboid, []);

    const nextCuboid = useCallback(() => {
        if (!selectedCuboid?.id) return;

        const sorted = [...cuboids].sort((a, b) => Number(a.id) - Number(b.id));
        const index = sorted.findIndex((c) => c.id === selectedCuboid.id);

        if (index !== -1 && index < sorted.length - 1) {
            const nextCuboid = sorted[index + 1];
            const target = getCuboidMeshPositionById(cuboidsGeometriesRef, nextCuboid.id);
            publish("switchCameraToPoint", target);
            setSelectedCuboid(nextCuboid);
        }
    }, [selectedCuboid?.id, cuboids]);

    useSubscribeFunction("nextCuboid", nextCuboid, []);

    return (
        <div className="tab-header-buttons">
            <SidebarIcon
                className="icon-style"
                size="20px"
                title={"Применить смещение"}
                icon={faTrailer}
                action={"applyPsr"}
            />
            <SidebarIcon
                className="icon-style"
                size="20px"
                title={"Скопировать смещение"}
                icon={faTruck}
                action={"copyPsrId"}
            />
            <SidebarIcon
                className={`icon-style ${isPrevButtonActive ? "" : "disabled"}`}
                size="20px"
                title={"Предыдущий объект"}
                icon={faAngleDoubleLeft}
                action={"prevCuboid"}
            />
            <SidebarIcon
                className={`icon-style ${isNextButtonActive ? "" : "disabled"}`}
                size="20px"
                title={"Следующий объект"}
                icon={faAngleDoubleRight}
                action={"nextCuboid"}
            />
            <SidebarIcon
                className="icon-style"
                size="20px"
                title="Удалить кубоид со всех кадров"
                icon={faTrash}
                action={"removeObject"}
                type={"removeObject"}
                index={selectedCuboid?.id}
            />
            <SidebarIcon
                className="icon-style"
                size="20px"
                title="Закрыть карточку"
                icon={faClose}
                type="setActiveTab"
                index={OBJECTS_TAB_INDEX}
            />
        </div>
    );
});
