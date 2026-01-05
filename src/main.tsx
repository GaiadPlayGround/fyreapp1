import { createRoot } from "react-dom/client";
import '@coinbase/onchainkit/styles.css';
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
