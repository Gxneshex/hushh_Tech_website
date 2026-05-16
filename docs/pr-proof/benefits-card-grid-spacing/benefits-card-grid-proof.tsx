import React from "react";
import { createRoot } from "react-dom/client";

import "../../../src/index.css";
import BenefitsPage from "../../../src/pages/benefits";

function BenefitsCardGridProof() {
  return (
    <main data-testid="benefits-card-grid-proof">
      <BenefitsPage />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BenefitsCardGridProof />
  </React.StrictMode>
);
