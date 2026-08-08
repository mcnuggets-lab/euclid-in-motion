import { useEffect, useState } from "react";

import { toAppPath, toHref } from "@/utils/baseUrl";

type LocationState = {
  hash: string;
  path: string;
};

function readLocation(): LocationState {
  const hash = window.location.hash;
  if (hash.startsWith("#/")) {
    const rawHash = hash.slice(1);
    const hashParts = rawHash.split("#");
    const appPath = hashParts[0] || "/";
    const sectionHash = hashParts[1] ? `#${hashParts[1]}` : "";
    return {
      hash: sectionHash,
      path: toAppPath(appPath),
    };
  }

  return {
    hash: window.location.hash,
    path: toAppPath(window.location.pathname),
  };
}

function parseLocation(nextPath: string): LocationState {
  const url = new URL(nextPath, window.location.origin);
  return {
    hash: url.hash,
    path: toAppPath(url.pathname),
  };
}

function scrollToLocation(hash: string) {
  if (!hash) {
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  const sectionId = decodeURIComponent(hash.slice(1));
  document.getElementById(sectionId)?.scrollIntoView({ block: "start" });
}

export function useCurrentPath() {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const handleLocationChange = () => setLocation(readLocation());

    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      scrollToLocation(location.hash),
    );

    return () => window.cancelAnimationFrame(frame);
  }, [location]);

  const navigate = (nextPath: string) => {
    const nextLocation = parseLocation(nextPath);
    if (
      nextLocation.path === location.path &&
      nextLocation.hash === location.hash
    ) {
      window.requestAnimationFrame(() => scrollToLocation(nextLocation.hash));
      return;
    }

    const fullPath = toHref(nextLocation.path);
    window.history.pushState(
      {},
      "",
      `${fullPath}${nextLocation.hash}`,
    );
    setLocation(nextLocation);
  };

  return { navigate, path: location.path };
}
