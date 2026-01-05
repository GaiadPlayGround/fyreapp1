import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import '@coinbase/onchainkit/styles.css';

createRoot(document.getElementById("root")!).render(<App />);
