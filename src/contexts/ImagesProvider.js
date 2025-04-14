import { createContext, useContext, useState } from "react";

import { DEFAULT_CAMERA } from "constants";

const ImagesContext = createContext();

export const ImagesProvider = ({ children }) => {
    const [selectedImage, setSelectedImage] = useState(DEFAULT_CAMERA);

    return (
        <ImagesContext.Provider
            value={{
                selectedImage,
                setSelectedImage,
            }}
        >
            {children}
        </ImagesContext.Provider>
    );
};

export const useImages = () => useContext(ImagesContext);
