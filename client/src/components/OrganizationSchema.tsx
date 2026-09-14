import { useEffect } from "react";

const SCHEMA_ID = "tce-organization-jsonld";

/** Organization structured data so Google understands the brand entity. */
export default function OrganizationSchema() {
  useEffect(() => {
    const existing = document.getElementById(SCHEMA_ID);
    if (existing) return;

    const script = document.createElement("script");
    script.id = SCHEMA_ID;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "The Consolidatus Empire LLC",
      alternateName: ["TCE Holdings", "The Consolidatus Empire", "Khomplete Khemistri"],
      url: "https://tceholdings.org/",
      logo: "https://tceholdings.org/favicon-blue-silver.png",
      description:
        "Premium apparel, accessories, creative ventures, and financial programs under The Consolidatus Empire LLC — including Khomplete Khemistri, Pocket Booster, Empire Invest, and the Centralized Hub.",
      sameAs: [],
    });
    document.head.appendChild(script);

    return () => {
      document.getElementById(SCHEMA_ID)?.remove();
    };
  }, []);

  return null;
}
