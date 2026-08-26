import { useEffect, useRef, useState } from "react";

export function useRouteAccessibility(path: string) {
  const previousPath = useRef(path);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const heading = document.querySelector<HTMLElement>("[data-page-heading]");
    if (!heading) {
      return;
    }

    const pageTitle = heading.textContent?.trim() || "the page";

    if (previousPath.current !== path) {
      heading.focus({ preventScroll: true });
      setAnnouncement(`Navigated to ${pageTitle}`);
    }

    previousPath.current = path;
  }, [path]);

  return announcement;
}
