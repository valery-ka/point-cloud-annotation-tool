import { createContext, useContext, useState, useRef } from "react";

const CalibrationsContext = createContext();

export const CalibrationsProvider = ({ children }) => {
    const projectedPointsRef = useRef({});

    const [calibrations, setCalibrations] = useState({});

    return (
        <CalibrationsContext.Provider
            value={{
                calibrations,
                setCalibrations,
                projectedPointsRef,
            }}
        >
            {children}
        </CalibrationsContext.Provider>
    );
};

export const useCalibrations = () => useContext(CalibrationsContext);
