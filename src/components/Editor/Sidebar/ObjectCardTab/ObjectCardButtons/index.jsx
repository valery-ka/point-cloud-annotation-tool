import { memo, useCallback, useMemo } from "react";
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

import { useTranslation } from "react-i18next";
import { useEvent, useCuboids, useOdometry, useFrames } from "contexts";
import { useSubscribeFunction } from "hooks";

import { SidebarIcon } from "../../SidebarIcon";

import { getCuboidMeshPositionById } from "utils/cuboids";
import { isEmpty } from "lodash";

// const COMPONENT_NAME = "ObjectCardButtons.";
const COMPONENT_NAME = "";
const OBJECTS_TAB_INDEX = 0;

export const ObjectCardButtons = memo(() => {
    const { t } = useTranslation();

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
                return `${t("applyTransformByID")} ${transformAction.id}`;
            case "odometry":
                return `${t("applyTransformByFrame")} ${transformAction.frame + 1}`;
            default:
                break;
        }
    };

    const prevObject = useCallback(() => {
        if (!selectedCuboid?.id) return;

        const sorted = [...cuboids].sort((a, b) => Number(a.id) - Number(b.id));
        const index = sorted.findIndex((c) => c.id === selectedCuboid.id);

        if (index > 0) {
            const prevObject = sorted[index - 1];
            const target = getCuboidMeshPositionById(cuboidsGeometriesRef, prevObject.id);
            publish("switchCameraToPoint", target);
            setSelectedCuboid(prevObject);
        }
    }, [selectedCuboid?.id, cuboids]);

    useSubscribeFunction("prevObject", prevObject, []);

    const nextObject = useCallback(() => {
        if (!selectedCuboid?.id) return;

        const sorted = [...cuboids].sort((a, b) => Number(a.id) - Number(b.id));
        const index = sorted.findIndex((c) => c.id === selectedCuboid.id);

        if (index !== -1 && index < sorted.length - 1) {
            const nextObject = sorted[index + 1];
            const target = getCuboidMeshPositionById(cuboidsGeometriesRef, nextObject.id);
            publish("switchCameraToPoint", target);
            setSelectedCuboid(nextObject);
        }
    }, [selectedCuboid?.id, cuboids]);

    useSubscribeFunction("nextObject", nextObject, []);

    return (
        <div className="tab-header-buttons">
            <SidebarIcon
                className={`icon-style ${hasOdometry && !isOdometryCopied ? "" : "disabled"}`}
                size="20px"
                title={t("fixOdometryFrame")}
                icon={isOdometryCopied ? faCheck : faMagic}
                action={"fixOdometryFrame"}
            />
            <SidebarIcon
                className={`icon-style ${isApplyPsrActive ? "" : "disabled"}`}
                size="20px"
                title={getTransformInfo()}
                icon={faTrailer}
                action={"applyTransform"}
            />
            <SidebarIcon
                className={`icon-style ${isPsrCopied ? "disabled" : ""}`}
                size="20px"
                title={t("copyObjectTransform")}
                icon={isPsrCopied ? faCheck : faTruck}
                action={"copyObjectTransform"}
            />
            <SidebarIcon
                className={`icon-style ${isPrevButtonActive ? "" : "disabled"}`}
                size="20px"
                title={t("prevObject")}
                icon={faAngleDoubleLeft}
                action={"prevObject"}
            />
            <SidebarIcon
                className={`icon-style ${isNextButtonActive ? "" : "disabled"}`}
                size="20px"
                title={t("nextObject")}
                icon={faAngleDoubleRight}
                action={"nextObject"}
            />
            <SidebarIcon
                className="icon-style"
                size="20px"
                title={t("removeObjectFromAllFrames")}
                icon={faTrash}
                action={"removeObject"}
                type={"removeObject"}
                index={selectedCuboid?.id}
            />
            <SidebarIcon
                className="icon-style"
                size="20px"
                title={t("closeObjectCard")}
                icon={faClose}
                type="setActiveTab"
                index={OBJECTS_TAB_INDEX}
            />
        </div>
    );
});
