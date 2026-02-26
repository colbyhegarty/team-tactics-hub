import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme preference
const savedTheme = localStorage.getItem('drillforge_theme');
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
