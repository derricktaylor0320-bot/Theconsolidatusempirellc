import { useEffect, useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DISCOUNT_CODES } from "@shared/discounts";
import {
  isRepeatSiteVisitor,
  readReturnVisitorDiscountEmail,
  storeReturnVisitorDiscountEmail,
} from "@/hooks/useSiteVisits";

const SUBSCRIBE_SOURCE = "air_genesis_return";

interface AirGenesisEmailCaptureProps {
  /** When true, also open a modal prompt for repeat visitors who have not subscribed yet. */
  showRepeatVisitorModal?: boolean;
}

export default function AirGenesisEmailCapture({
  showRepeatVisitorModal = false,
}: AirGenesisEmailCaptureProps) {
  const existingEmail = readReturnVisitorDiscountEmail();
  const [email, setEmail] = useState(existingEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(
    existingEmail
      ? `Your $5 welcome-back discount (${DISCOUNT_CODES.RETURN_VISITOR}) is ready at checkout.`
      : "",
  );
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);

  const repeatVisitor = isRepeatSiteVisitor();
  const shouldPromptModal =
    showRepeatVisitorModal &&
    repeatVisitor &&
    !existingEmail &&
    !modalDismissed;

  useEffect(() => {
    if (!shouldPromptModal) return;
    const timer = window.setTimeout(() => setModalOpen(true), 600);
    return () => window.clearTimeout(timer);
  }, [shouldPromptModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: SUBSCRIBE_SOURCE }),
      });
      const data = await response.json();

      if (response.ok) {
        storeReturnVisitorDiscountEmail(email);
        setMessage(
          repeatVisitor
            ? `You're in! Use code ${DISCOUNT_CODES.RETURN_VISITOR} at checkout for $5 off your Air Genesis order.`
            : `Thanks for joining! Come back on your next visit and unlock $5 off with your email.`,
        );
        setModalOpen(false);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissModal = () => {
    setModalOpen(false);
    setModalDismissed(true);
  };

  const subscribed = Boolean(readReturnVisitorDiscountEmail() || existingEmail);

  return (
    <>
      <div
        className="mb-8 rounded-xl border border-primary/30 bg-primary/5 p-5"
        data-testid="air-genesis-email-capture"
      >
        <div className="flex items-start gap-3 mb-3">
          <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-display font-semibold uppercase tracking-wide text-sm text-primary">
              Drop 1 Email List
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {repeatVisitor
                ? "Welcome back — join the list and take $5 off your Air Genesis order at checkout."
                : "Join for Drop 1 updates. Return visitors unlock $5 off at checkout."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={subscribed}
            className="bg-background border-primary/30"
            data-testid="input-air-genesis-email"
          />
          <Button
            type="submit"
            disabled={isSubmitting || subscribed}
            className="shrink-0 uppercase tracking-wider font-display"
            data-testid="button-air-genesis-email-submit"
          >
            {isSubmitting ? "Joining..." : subscribed ? "Subscribed" : "Get $5 Off"}
          </Button>
        </form>

        {error && (
          <p className="text-red-400 text-sm mt-2" data-testid="text-air-genesis-email-error">
            {error}
          </p>
        )}
        {message && (
          <p className="text-primary text-sm mt-2" data-testid="text-air-genesis-email-success">
            {message}
          </p>
        )}
      </div>

      <Dialog open={modalOpen && shouldPromptModal} onOpenChange={(open) => !open && dismissModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Welcome Back
            </DialogTitle>
            <DialogDescription>
              Drop 1 Air Genesis is here. Join the email list now and save $5 on your order —
              code {DISCOUNT_CODES.RETURN_VISITOR} applies at checkout after you subscribe.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-air-genesis-modal-email"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Joining..." : "Unlock $5 Off"}
              </Button>
              <Button type="button" variant="outline" onClick={dismissModal}>
                Not now
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
