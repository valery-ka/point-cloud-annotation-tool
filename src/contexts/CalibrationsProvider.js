import { createContext, useContext, useState, useRef } from "react";

const CalibrationsContext = createContext();

export const CalibrationsProvider = ({ children }) => {
    const projectedPointsRef = useRef({});

    const [calibrations, setCalibrations] = useState({});
    const [areCalibrationsProcessed, setAreCalibrationsProcessed] = useState(false);

    return (
        <CalibrationsContext.Provider
            value={{
                areCalibrationsProcessed,
                setAreCalibrationsProcessed,
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
