import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquareHeart } from "lucide-react";

type CustomerFeedbackFormProps = {
  compact?: boolean;
};

export default function CustomerFeedbackForm({ compact }: CustomerFeedbackFormProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [interestArea, setInterestArea] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || undefined,
          interestArea: interestArea.trim() || undefined,
          message,
          sourcePath: location,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not send feedback");
      }
      setMessage("");
      setInterestArea("");
      toast({
        title: "Thank you!",
        description: "Your feedback reached the Empire team.",
      });
    } catch (error) {
      toast({
        title: "Could not send",
        description:
          error instanceof Error ? error.message : "Please try again shortly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? "space-y-3 text-left"
          : "mx-auto max-w-xl space-y-4 rounded-2xl border border-primary/25 bg-background/70 p-6 text-left"
      }
      data-testid="form-customer-feedback"
    >
      {!compact && (
        <div className="flex items-center gap-2 text-primary">
          <MessageSquareHeart className="h-5 w-5" />
          <h3 className="font-display text-lg font-bold uppercase tracking-wide">
            Tell Us What You Want More Of
          </h3>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="feedback-email">Email (optional)</Label>
        <Input
          id="feedback-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          data-testid="input-feedback-email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="feedback-interest">What are you most interested in?</Label>
        <Input
          id="feedback-interest"
          value={interestArea}
          onChange={(e) => setInterestArea(e.target.value)}
          placeholder="Apparel, Pocket Booster, Elements, etc."
          data-testid="input-feedback-interest"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="feedback-message">Your message</Label>
        <Textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={compact ? 3 : 4}
          required
          minLength={10}
          placeholder="What would you like to see more of from The Consolidatus Empire?"
          data-testid="input-feedback-message"
        />
      </div>
      <Button
        type="submit"
        disabled={submitting || message.trim().length < 10}
        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider font-display"
        data-testid="button-feedback-submit"
      >
        {submitting ? "Sending…" : "Send Feedback"}
      </Button>
    </form>
  );
}
