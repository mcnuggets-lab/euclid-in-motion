const rawBaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "/";

export function normalizePath(path: string): string {
  if (!path || path === "/") {
    return "/";
  }

  return path.endsWith("/") ? path.slice(0, -1) : path;
}

export function toAppPath(pathname: string, base: string = rawBaseUrl): string {
  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
  let rawPath = pathname;

  if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    rawPath = pathname.slice(prefix.length);
  }

  return normalizePath(rawPath);
}

export function toHref(path: string, base: string = rawBaseUrl): string {
  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;

  if (!prefix) {
    return path || "/";
  }

  if (path === prefix || path.startsWith(`${prefix}/`)) {
    return path;
  }

  if (path === "/" || path === "") {
    return `${prefix}/`;
  }

  if (path.startsWith("#")) {
    return `${prefix}/${path}`;
  }

  return path.startsWith("/") ? `${prefix}${path}` : `${prefix}/${path}`;
}
