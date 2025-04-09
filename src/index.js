import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AppProviders } from "@contexts";
import "./styles/App.scss";
import "./config//i18n";

const root = createRoot(document.getElementById("root"));
root.render(
    <AppProviders>
        <App />
    </AppProviders>
);
