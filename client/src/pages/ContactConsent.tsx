import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, MessageSquare } from "lucide-react";

const SMS_CONSENT_TEXT =
  "The Consolidatus Empire LLC would like your consent to send text message communications from +1-844-561-2444 in response to your questions or to provide information related to your relationship with us.";

export default function ContactConsent() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!smsConsent) {
      toast({
        title: "Consent required",
        description: "Please check the box to consent to text message communications.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/contact-consent", {
        name,
        email,
        phone,
        message,
        smsConsent,
      });
      const data = await res.json();
      setSubmitted(true);
      toast({
        title: "Message sent",
        description:
          data.message ||
          "Thank you. We received your information and SMS consent.",
      });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "Something went wrong";
      const messageText = raw.replace(/^\d+:\s*/, "");
      let parsed = messageText;
      try {
        parsed = JSON.parse(messageText).error || messageText;
      } catch {
        // keep parsed as messageText
      }
      toast({
        title: "Could not submit form",
        description: parsed,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-bold uppercase tracking-tight md:text-4xl">
                Contact &amp; Text Consent
              </h1>
              <p className="mt-3 text-muted-foreground">
                Share your details and consent to receive text message
                communications from The Consolidatus Empire LLC.
              </p>
            </div>

            <Card className="border-primary/20 bg-background/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-display uppercase tracking-wide">
                  Get in Touch
                </CardTitle>
                <CardDescription>
                  Fill out the form below. Message and data rates may apply.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div
                    className="space-y-4 text-center"
                    data-testid="contact-consent-success"
                  >
                    <p className="text-sm text-muted-foreground">
                      Thank you, <span className="font-medium text-foreground">{name}</span>.
                      We received your message and SMS consent. A member of our team
                      may follow up by email or text at{" "}
                      <span className="font-medium text-foreground">{phone}</span>.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSubmitted(false);
                        setName("");
                        setEmail("");
                        setPhone("");
                        setMessage("");
                        setSmsConsent(false);
                      }}
                      data-testid="button-contact-consent-reset"
                    >
                      Submit another message
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    data-testid="form-contact-consent"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Name</Label>
                      <Input
                        id="contact-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        data-testid="input-contact-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        data-testid="input-contact-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone Number</Label>
                      <Input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 555-5555"
                        data-testid="input-contact-phone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-message">Text Message</Label>
                      <Textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="How can we help you?"
                        data-testid="input-contact-message"
                      />
                    </div>

                    <div className="rounded-md border border-primary/20 bg-muted/30 p-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {SMS_CONSENT_TEXT}
                      </p>
                      <div className="mt-4 flex items-start gap-3">
                        <Checkbox
                          id="contact-sms-consent"
                          checked={smsConsent}
                          onCheckedChange={(checked) =>
                            setSmsConsent(checked === true)
                          }
                          required
                          data-testid="checkbox-sms-consent"
                        />
                        <Label
                          htmlFor="contact-sms-consent"
                          className="cursor-pointer text-sm font-normal leading-relaxed"
                        >
                          Yes, I consent
                        </Label>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                      data-testid="button-contact-consent-submit"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
