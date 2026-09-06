import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AppShell } from "./components/layout/AppShell";

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <AppShell />
      </HashRouter>
    </ThemeProvider>
  );
}
