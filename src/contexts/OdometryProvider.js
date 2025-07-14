import { createContext, useContext, useState, useEffect } from "react";

import { useLoading } from "contexts";

const OdometryContext = createContext();

export const OdometryProvider = ({ children }) => {
    const [odometry, setOdometry] = useState({});

    const { isCleaningUp, setIsCleaningUp } = useLoading();

    useEffect(() => {
        if (!isCleaningUp.hoveredPoint) return;
        setOdometry({});

        setIsCleaningUp((prev) => ({
            ...prev,
            odometry: true,
        }));
    }, [isCleaningUp.hoveredPoint]);

    return (
        <OdometryContext.Provider
            value={{
                odometry,
                setOdometry,
            }}
        >
            {children}
        </OdometryContext.Provider>
    );
};

export const useOdometry = () => useContext(OdometryContext);
