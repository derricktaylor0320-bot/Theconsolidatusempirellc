import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * If the hub SPA client-router reaches /fr2p/embed, hand off to the server-hosted
 * FR2P Club app with a full document navigation.
 */
export default function Fr2pEmbedHandoff() {
  useEffect(() => {
    const target =
      window.location.pathname +
      window.location.search +
      window.location.hash;
    window.location.replace(target);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020D3C]">
      <div className="text-center space-y-3" data-testid="fr2p-embed-handoff">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm text-[#F5F5DC]/80">Loading The FR2P Club…</p>
      </div>
    </div>
  );
}
