import { useEffect, useMemo } from "react";

import {
  axiomById,
  axiomExplorationByPath,
  guideById,
  theoremById,
} from "@/data/catalog";
import { resolvePage } from "@/features/content/contentRouting";
import {
  formatDocumentTitle,
  getPageMeta,
  type PageMetaEntries,
} from "@/features/content/pageMeta";

const pageMetaEntries: PageMetaEntries = {
  axiomById,
  axiomExplorationByPath,
  guideById,
  theoremById,
};

type MetaAttribute = "name" | "property";

function setMetaTag(
  selector: string,
  attribute: MetaAttribute,
  key: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

/**
 * Keeps `document.title` and the description/OG/Twitter meta tags in sync with
 * the current route. The static OG image from index.html is left untouched.
 */
export function usePageMeta(path: string) {
  const meta = useMemo(
    () => getPageMeta(resolvePage(path), pageMetaEntries),
    [path],
  );

  useEffect(() => {
    document.title = formatDocumentTitle(meta);
    setMetaTag('meta[name="description"]', "name", "description", meta.description);

    const titleTags: Array<[string, string]> = [
      ['meta[property="og:title"]', "og:title"],
      ['meta[name="twitter:title"]', "twitter:title"],
    ];
    for (const [selector, key] of titleTags) {
      setMetaTag(selector, key.startsWith("og:") ? "property" : "name", key, meta.title);
    }

    const descriptionTags: Array<[string, string]> = [
      ['meta[property="og:description"]', "og:description"],
      ['meta[name="twitter:description"]', "twitter:description"],
    ];
    for (const [selector, key] of descriptionTags) {
      setMetaTag(
        selector,
        key.startsWith("og:") ? "property" : "name",
        key,
        meta.description,
      );
    }
  }, [meta]);
}
