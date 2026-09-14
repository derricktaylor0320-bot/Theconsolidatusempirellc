import { ExternalLink, Search, BarChart3, ShieldCheck, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type GoogleSetupInfo = {
  gaMeasurementId: string | null;
  gaConfigured: boolean;
  googleSiteVerificationConfigured: boolean;
  publicSiteUrl: string;
  sitemapUrl: string;
  robotsUrl: string;
  searchConsoleUrl: string;
  analyticsUrl: string;
  brandName: string;
  domain: string;
};

type GoogleSearchSetupCardProps = {
  google: GoogleSetupInfo;
};

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge variant={ok ? "default" : "secondary"} className={ok ? "bg-emerald-600/90 hover:bg-emerald-600/90" : ""}>
      {label}
    </Badge>
  );
}

export default function GoogleSearchSetupCard({ google }: GoogleSearchSetupCardProps) {
  return (
    <Card data-testid="card-google-setup">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Google Analytics &amp; Search Visibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            ok={google.gaConfigured}
            label={google.gaConfigured ? "GA4 connected" : "GA4 not configured"}
          />
          <StatusBadge
            ok={google.googleSiteVerificationConfigured}
            label={
              google.googleSiteVerificationConfigured
                ? "Search Console tag ready"
                : "Verification tag pending"
            }
          />
        </div>

        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Your WHOIS privacy choice is fine.</strong>{" "}
          Keeping your personal owner details private in domain records does{" "}
          <em>not</em> make your site illegitimate and does <em>not</em> block Google.
          Search rankings come from your public website content, sitemap, and Search Console —
          not from who owns the domain in WHOIS.
        </p>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <h3 className="font-display font-semibold uppercase tracking-wide text-primary flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Step 1 — Google Analytics (visitors &amp; sales)
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Go to{" "}
              <a
                href="https://analytics.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                analytics.google.com
              </a>{" "}
              and sign in with your Google account.
            </li>
            <li>Create a property for <strong>{google.brandName}</strong>.</li>
            <li>
              Add a <strong>Web</strong> data stream for{" "}
              <code className="text-xs bg-background/80 px-1 rounded">{google.publicSiteUrl}</code>
            </li>
            <li>
              Copy the Measurement ID (starts with <code className="text-xs">G-</code>) and set{" "}
              <code className="text-xs bg-background/80 px-1 rounded">GA_MEASUREMENT_ID</code> on
              Railway, then redeploy.
            </li>
          </ol>
          {google.gaMeasurementId && (
            <p className="text-xs text-muted-foreground">
              Current ID: <span className="font-mono text-foreground">{google.gaMeasurementId}</span>
            </p>
          )}
          <Button size="sm" variant="outline" className="gap-1" asChild>
            <a href={google.analyticsUrl} target="_blank" rel="noopener noreferrer">
              Open Google Analytics <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>

        <div className="rounded-lg border border-border/60 p-4 space-y-3">
          <h3 className="font-display font-semibold uppercase tracking-wide flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Step 2 — Google Search Console (be found on Google)
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Open{" "}
              <a
                href={google.searchConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                Google Search Console
              </a>{" "}
              and add property <strong>{google.domain}</strong>.
            </li>
            <li>
              <strong>Recommended:</strong> verify with a <strong>DNS TXT record</strong> at your
              domain registrar (works with WHOIS privacy — Google never needs your personal info).
            </li>
            <li>
              Or use the HTML meta tag method: copy the verification code Google gives you and set{" "}
              <code className="text-xs bg-background/80 px-1 rounded">GOOGLE_SITE_VERIFICATION</code>{" "}
              on Railway, then redeploy.
            </li>
            <li>
              Submit your sitemap:{" "}
              <a
                href={google.sitemapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline break-all"
              >
                {google.sitemapUrl}
              </a>
            </li>
            <li>
              Use <strong>URL Inspection</strong> → Request Indexing for your homepage and Hub.
              New sites usually take days to a few weeks to appear for brand searches.
            </li>
          </ol>
          <Button size="sm" variant="outline" className="gap-1" asChild>
            <a href={google.searchConsoleUrl} target="_blank" rel="noopener noreferrer">
              Open Search Console <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>

        <div className="rounded-lg border border-border/60 p-4 space-y-2">
          <h3 className="font-display font-semibold uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Already built into your site
          </h3>
          <ul className="text-muted-foreground space-y-1">
            <li>
              Sitemap:{" "}
              <a href={google.sitemapUrl} className="text-primary underline-offset-4 hover:underline break-all">
                {google.sitemapUrl}
              </a>
            </li>
            <li>
              Robots:{" "}
              <a href={google.robotsUrl} className="text-primary underline-offset-4 hover:underline break-all">
                {google.robotsUrl}
              </a>
            </li>
            <li>Organization structured data (JSON-LD) on every page</li>
            <li>Cookie-consent GA4 tracking for page views, products, and checkout</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
