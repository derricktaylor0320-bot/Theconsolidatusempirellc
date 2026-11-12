import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * Empire Motivations now live inside The FR2P Club.
 * Hand off with a full document navigation so the embed SPA owns the route.
 */
export default function Motivations() {
  useEffect(() => {
    window.location.replace("/fr2p/embed/motivations");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020D3C]">
      <div className="text-center space-y-3" data-testid="motivations-fr2p-handoff">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm text-[#F5F5DC]/80">
          Opening Empire Motivations in The FR2P Club…
        </p>
      </div>
    </div>
  );
}
