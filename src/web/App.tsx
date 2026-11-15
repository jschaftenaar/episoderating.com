import { Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { ShowsPage } from "./pages/ShowsPage";
import { ShowPage } from "./pages/ShowPage";
import { AboutPage } from "./pages/AboutPage";
import { ComparePage } from "./pages/ComparePage";

export function App() {
  const { pathname } = useLocation();
  const fullBleed = pathname.startsWith("/show/");

  return (
    <div className={`app-shell ${fullBleed ? "app-shell--bleed" : ""}`}>
      <Header />
      <main className={fullBleed ? "app-main app-main--bleed" : "app-main"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shows" element={<ShowsPage />} />
          <Route path="/show/:imdbId" element={<ShowPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </div>
  );
}
