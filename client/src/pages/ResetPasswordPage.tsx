import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle2 } from "lucide-react";
import logo from "@assets/generated_images/consolidatus_empire_logo_2020.png";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(search);
    setToken(params.get("token") || "");
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", { token, password });
      setDone(true);
      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });
    } catch (err: any) {
      const message = (err?.message || "Something went wrong").replace(
        /^\d+:\s*/,
        "",
      );
      let parsed = message;
      try {
        parsed = JSON.parse(message).error || message;
      } catch {}
      toast({
        title: "Couldn't reset password",
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
      <main className="flex-grow relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-md mx-auto">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/40 to-primary/5 flex items-center justify-center border border-primary/40 shadow-[0_0_40px_rgba(212,175,55,0.3)]">
                <img
                  src={logo}
                  alt="Consolidatus Empire"
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>
            <Card className="border-primary/20 bg-background/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-display uppercase tracking-wide text-center">
                  Set a New Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                {done ? (
                  <div className="space-y-4 text-center">
                    <div className="flex justify-center">
                      <CheckCircle2 className="w-12 h-12 text-primary" />
                    </div>
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid="text-reset-success"
                    >
                      Your password has been updated. You can now sign in with
                      your new password.
                    </p>
                    <Button
                      type="button"
                      className="w-full bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
                      onClick={() => setLocation("/auth")}
                      data-testid="button-go-to-login"
                    >
                      Go to sign in
                    </Button>
                  </div>
                ) : !token ? (
                  <div className="space-y-4 text-center">
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid="text-missing-token"
                    >
                      This reset link is missing or invalid. Please request a new
                      one from the sign-in page.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation("/auth")}
                      data-testid="button-back-to-auth"
                    >
                      Back to sign in
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New password</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        data-testid="input-new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirm password</Label>
                      <Input
                        id="confirm"
                        type="password"
                        required
                        placeholder="Re-enter your password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        data-testid="input-confirm-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
                      data-testid="button-submit-reset"
                    >
                      {submitting && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Update Password
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
