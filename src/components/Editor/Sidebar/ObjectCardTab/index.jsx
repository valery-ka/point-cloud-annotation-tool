import { memo, useEffect, useState, useCallback } from "react";
import { faClose, faTrash, faPlus, faMinus, faEdit } from "@fortawesome/free-solid-svg-icons";

import { useEvent, useCuboids } from "contexts";

import { SidebarIcon } from "../SidebarIcon";
import { ObjectCardInfoBlock } from "./ObjectCardInfoBlock";

import { TABS } from "constants";

// const COMPONENT_NAME = "ObjectCardTab.";
const COMPONENT_NAME = "";
const OBJECTS_TAB_INDEX = 0;

export const ObjectCardTab = memo(() => {
    const { publish } = useEvent();
    const { selectedCuboid, selectedCuboidRef } = useCuboids();

    const [isTextInputActive, setIsTextInputActive] = useState({ textInputActiveFields: {} });

    useEffect(() => {
        selectedCuboid ? openObjectCard() : closeObjectCard();
    }, [selectedCuboid?.id]);

    const openObjectCard = useCallback(() => {
        publish("setActiveTab", TABS.OBJECT_CARD);
    }, [publish]);

    const closeObjectCard = useCallback(() => {
        publish("setActiveTab", OBJECTS_TAB_INDEX);
    }, [publish]);

    const plusScale = useCallback((data) => {
        console.log("plus");
    }, []);

    const minusScale = useCallback((data) => {
        console.log("minus");
    }, []);

    const editData = useCallback((data) => {
        console.log("editing");
    }, []);

    return (
        <div className="sidebar-tab-panel">
            <div className="tab-header-container">
                <h2 className="tab-header">ID: {selectedCuboid?.id}</h2>
                <div className="tab-header-buttons">
                    <SidebarIcon
                        className="icon-style"
                        size="20px"
                        title="Удалить кубоид со всех кадров"
                        icon={faTrash}
                    />
                    <SidebarIcon
                        className="icon-style"
                        size="20px"
                        title="Закрыть карточку"
                        icon={faClose}
                        type={"setActiveTab"}
                        index={OBJECTS_TAB_INDEX}
                    />
                </div>
            </div>
            <div className="sidebar-content">
                <div className="object-info-container">
                    <div className="object-label-item">
                        <div
                            className="color-box"
                            style={{ backgroundColor: selectedCuboid?.color }}
                        ></div>
                        <div className="object-label-button">
                            <h3 className="classes-label">{selectedCuboid?.type}</h3>
                        </div>
                    </div>
                    <div className="object-card-info-block-container">
                        <ObjectCardInfoBlock
                            title="Точки"
                            data={{
                                "Точек внутри бокса": selectedCuboid?.insidePoints?.length,
                                "Покрашенных точек": 0,
                            }}
                            decimals={0}
                        />
                        <ObjectCardInfoBlock
                            title="Позиция коробки"
                            data={{
                                "Позиция X": selectedCuboid?.position[0],
                                "Позиция Y": selectedCuboid?.position[1],
                                "Позиция Z": selectedCuboid?.position[2],
                            }}
                            buttons={{
                                edit: { icon: faEdit, callback: editData },
                            }}
                            unit=" m"
                        />
                        <ObjectCardInfoBlock
                            title="Размеры коробки"
                            data={{
                                Длина: selectedCuboid?.scale[0],
                                Ширина: selectedCuboid?.scale[1],
                                Высота: selectedCuboid?.scale[2],
                            }}
                            buttons={{
                                plus: { icon: faPlus, callback: plusScale },
                                minus: { icon: faMinus, callback: minusScale },
                                edit: { icon: faEdit, callback: editData },
                            }}
                            unit=" m"
                        />
                        <ObjectCardInfoBlock
                            title="Вращение коробки"
                            data={{
                                Крен: selectedCuboid?.rotation[0] * (180 / Math.PI),
                                Тангаж: selectedCuboid?.rotation[1] * (180 / Math.PI),
                                Рыскание: selectedCuboid?.rotation[2] * (180 / Math.PI),
                            }}
                            buttons={{
                                edit: { icon: faEdit, callback: editData },
                            }}
                            unit="°"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});
