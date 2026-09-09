import { useSiteVisits } from "@/hooks/useSiteVisits";

/** Tracks browser sessions so repeat visitors can unlock ReturnVisitor5. */
export default function SiteVisitTracker() {
  useSiteVisits();
  return null;
}
