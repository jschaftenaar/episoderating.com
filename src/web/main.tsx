import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { SourceProvider } from "./components/SourceProvider";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SourceProvider>
        <App />
      </SourceProvider>
    </BrowserRouter>
  </StrictMode>,
);
