import { useEffect, useState } from "react";

import { useCurrentPath } from "@/hooks/useCurrentPath";
import { useRouteAccessibility } from "@/hooks/useRouteAccessibility";
import { ContentView } from "@/features/content/ContentView";
import { BrowseToggle, SidebarNav } from "@/features/navigation/SidebarNav";

const desktopBrowseQuery = "(min-width: 881px)";

export function App() {
  const { navigate, path } = useCurrentPath();
  const [isBrowseOpen, setIsBrowseOpen] = useState(() =>
    window.matchMedia(desktopBrowseQuery).matches,
  );
  const routeAnnouncement = useRouteAccessibility(path);

  useEffect(() => {
    const desktopQuery = window.matchMedia(desktopBrowseQuery);
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      const browseNavigation = document.getElementById("browse-navigation");
      if (
        !event.matches &&
        browseNavigation?.contains(document.activeElement)
      ) {
        document
          .querySelector<HTMLButtonElement>("[aria-controls='browse-navigation']")
          ?.focus();
      }

      setIsBrowseOpen(event.matches);
    };

    desktopQuery.addEventListener("change", handleBreakpointChange);
    return () => desktopQuery.removeEventListener("change", handleBreakpointChange);
  }, []);

  const handleNavigate = (nextPath: string) => {
    navigate(nextPath);
    if (!window.matchMedia(desktopBrowseQuery).matches) {
      setIsBrowseOpen(false);
    }
  };

  return (
    <div className="app-shell">
      <div
        aria-atomic="true"
        aria-live="polite"
        className="visually-hidden"
        role="status"
      >
        {routeAnnouncement}
      </div>
      <header className="hero">
        <div>
          <span className="eyebrow">Euclid in Motion</span>
          <h1>Explore Euclidean geometry.</h1>
        </div>
        <p>
          Move geometric figures, identify relationships that remain invariant, and
          connect Hilbert-style axioms to the theorems they support.
        </p>
      </header>

      <main className={isBrowseOpen ? "workspace workspace--browse-open" : "workspace"}>
        <div className="browse-toggle-slot">
          <BrowseToggle
            isOpen={isBrowseOpen}
            onToggle={() => setIsBrowseOpen((open) => !open)}
          />
        </div>
        <SidebarNav
          currentPath={path}
          hidden={!isBrowseOpen}
          onNavigate={handleNavigate}
        />
        <ContentView key={path} onNavigate={handleNavigate} path={path} />
      </main>
    </div>
  );
}
