import { createContext, useContext, useState, useRef, useEffect } from "react";

import { useLoading } from "contexts";

const CalibrationsContext = createContext();

export const CalibrationsProvider = ({ children }) => {
    const { isCleaningUp, setIsCleaningUp } = useLoading();

    const projectedPointsRef = useRef({});
    const projectedCuboidsRef = useRef({});

    const [calibrations, setCalibrations] = useState({});

    useEffect(() => {
        if (!isCleaningUp.batch) return;

        projectedPointsRef.current = {};
        projectedCuboidsRef.current = {};

        setCalibrations({});

        setIsCleaningUp((prev) => ({
            ...prev,
            calibrations: true,
        }));
    }, [isCleaningUp.batch]);

    return (
        <CalibrationsContext.Provider
            value={{
                calibrations,
                setCalibrations,
                projectedPointsRef,
                projectedCuboidsRef,
            }}
        >
            {children}
        </CalibrationsContext.Provider>
    );
};

export const useCalibrations = () => useContext(CalibrationsContext);
