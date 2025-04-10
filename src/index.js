import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "components";
import { AppProviders } from "contexts";
import "./styles/App.scss";
import "./config//i18n";

const root = createRoot(document.getElementById("root"));
root.render(
    <ErrorBoundary>
        <AppProviders>
            <App />
        </AppProviders>
    </ErrorBoundary>,
);
