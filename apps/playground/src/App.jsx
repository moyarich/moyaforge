import { HashRouter } from "react-router-dom";
import { PlaygroundRoutes } from "./components/PlaygroundRoutes.jsx";

export function App() {
  return (
    <HashRouter>
      <PlaygroundRoutes />
    </HashRouter>
  );
}
