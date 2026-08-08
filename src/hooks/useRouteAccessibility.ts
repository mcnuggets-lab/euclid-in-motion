import { useEffect, useRef, useState } from "react";

const siteName = "Euclid in Motion";

export function useRouteAccessibility(path: string) {
  const previousPath = useRef(path);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const heading = document.querySelector<HTMLElement>("[data-page-heading]");
    if (!heading) {
      return;
    }

    const pageTitle = heading.textContent?.trim() || siteName;
    document.title = `${pageTitle} | ${siteName}`;

    if (previousPath.current !== path) {
      heading.focus({ preventScroll: true });
      setAnnouncement(`Navigated to ${pageTitle}`);
    }

    previousPath.current = path;
  }, [path]);

  return announcement;
}
