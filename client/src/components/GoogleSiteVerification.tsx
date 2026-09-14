import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

type SiteConfig = {
  googleSiteVerification?: string | null;
};

const META_NAME = "google-site-verification";

/** Injects Search Console verification meta tag when GOOGLE_SITE_VERIFICATION is set on the server. */
export default function GoogleSiteVerification() {
  const { data } = useQuery<SiteConfig>({
    queryKey: ["/api/site-config"],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const token = data?.googleSiteVerification?.trim();
    if (!token) return;

    let meta = document.querySelector(`meta[name="${META_NAME}"]`) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = META_NAME;
      document.head.appendChild(meta);
    }
    meta.content = token;
  }, [data?.googleSiteVerification]);

  return null;
}
