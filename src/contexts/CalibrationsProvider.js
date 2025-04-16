import { createContext, useContext, useState } from "react";

const CalibrationsContext = createContext();

export const CalibrationsProvider = ({ children }) => {
    const [calibrations, setCalibrations] = useState({});
    const [areCalibrationsProcessed, setAreCalibrationsProcessed] = useState(false);

    return (
        <CalibrationsContext.Provider
            value={{
                areCalibrationsProcessed,
                setAreCalibrationsProcessed,
                calibrations,
                setCalibrations,
            }}
        >
            {children}
        </CalibrationsContext.Provider>
    );
};

export const useCalibrations = () => useContext(CalibrationsContext);
