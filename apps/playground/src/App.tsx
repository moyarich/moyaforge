import { HashRouter } from "react-router-dom";
import { PlaygroundRoutes } from "./components/PlaygroundRoutes.tsx";

export function App() {
  return (
    <HashRouter>
      <PlaygroundRoutes />
    </HashRouter>
  );
}
