import { memo, useCallback, useMemo, useEffect } from "react";
import {
    faClose,
    faTrash,
    faAngleDoubleLeft,
    faAngleDoubleRight,
    faTruck,
    faTrailer,
    faMagic,
    faCheck,
} from "@fortawesome/free-solid-svg-icons";

import { useEvent, useCuboids, useOdometry, useFrames } from "contexts";
import { useSubscribeFunction } from "hooks";

import { SidebarIcon } from "../../SidebarIcon";

import { getCuboidMeshPositionById } from "utils/cuboids";
import { isEmpty } from "lodash";

// const COMPONENT_NAME = "ObjectCardButtons.";
const COMPONENT_NAME = "";
const OBJECTS_TAB_INDEX = 0;

export const ObjectCardButtons = memo(() => {
    const { publish } = useEvent();

    const { activeFrameIndex } = useFrames();
    const { odometry } = useOdometry();
    const { cuboids, selectedCuboid, setSelectedCuboid, cuboidsGeometriesRef, copiedPSRRef } =
        useCuboids();

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

    const hasOdometry = useMemo(() => {
        return !isEmpty(odometry);
    }, [odometry]);

    const isPsrCopied = copiedPSRRef.current?.id === selectedCuboid?.id;
    const isOdometryCopied = copiedPSRRef.current?.frame === activeFrameIndex;
    const isApplyPsrActive = copiedPSRRef.current;

    const getTransformInfo = () => {
        const transformAction = copiedPSRRef.current;

        switch (transformAction?.source) {
            case "psr":
                return `по ID: ${transformAction.id}`;
            case "odometry":
                return `по кадру: ${transformAction.frame}`;
            default:
                break;
        }
    };

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
                className={`icon-style ${hasOdometry && !isOdometryCopied ? "" : "disabled"}`}
                size="20px"
                title={"Зафиксировать кадр одометрии"}
                icon={isOdometryCopied ? faCheck : faMagic}
                action={"copyOdometryFrame"}
            />
            <SidebarIcon
                className={`icon-style ${isApplyPsrActive ? "" : "disabled"}`}
                size="20px"
                title={`Применить смещение ${getTransformInfo()}`}
                icon={faTrailer}
                action={"applyTransform"}
            />
            <SidebarIcon
                className={`icon-style ${isPsrCopied ? "disabled" : ""}`}
                size="20px"
                title={"Скопировать смещение объекта"}
                icon={isPsrCopied ? faCheck : faTruck}
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
