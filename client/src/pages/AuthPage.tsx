import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import logo from "@assets/generated_images/consolidatus_empire_logo_2020.png";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setLocation("/hub");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", {
        email,
      });
      const data = await res.json();
      setForgotSent(true);
      toast({
        title: "Check your inbox",
        description:
          data.message ||
          "If an account exists for that email, a reset link is on its way.",
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
        title: "Couldn't send reset link",
        description: parsed,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") return handleForgotSubmit(e);
    setSubmitting(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, displayName: displayName || undefined };
      const res = await apiRequest("POST", url, body);
      const user = await res.json();
      queryClient.setQueryData(["/api/auth/user"], user);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title:
          mode === "login" ? "Welcome back!" : "Account created — you're in!",
        description: "Your sign-in is now shared across the entire hub.",
      });
      setLocation("/hub");
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
        title: "Sign-in failed",
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
          <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
            {/* Hero / value side */}
            <div className="text-center md:text-left">
              <div className="flex justify-center md:justify-start mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/40 to-primary/5 flex items-center justify-center border border-primary/40 shadow-[0_0_40px_rgba(212,175,55,0.3)]">
                  <img
                    src={logo}
                    alt="Consolidatus Empire"
                    className="w-14 h-14 object-contain"
                  />
                </div>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight">
                One Sign-In for the{" "}
                <span className="text-primary">Empire</span>
              </h1>
              <p className="text-muted-foreground mt-4 text-lg">
                Sign in once from the Centralized Hub and move freely between
                every Khomplete Khemistri app — Pocket Booster, Prospect
                Identity, FR2P Program and more.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground inline-block text-left">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> One account across
                  the whole hub
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Stay signed in for
                  30 days
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Your status shows
                  on every connected app
                </li>
              </ul>
            </div>

            {/* Form side */}
            <Card className="border-primary/20 bg-background/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-display uppercase tracking-wide text-center">
                  {mode === "login"
                    ? "Sign In"
                    : mode === "register"
                      ? "Create Account"
                      : "Reset Password"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mode !== "forgot" && (
                  <Tabs
                    value={mode}
                    onValueChange={(v) => setMode(v as "login" | "register")}
                    className="mb-6"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login" data-testid="tab-login">
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger value="register" data-testid="tab-register">
                        Sign Up
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="login" />
                    <TabsContent value="register" />
                  </Tabs>
                )}

                {mode === "forgot" && forgotSent ? (
                  <div className="space-y-4 text-center">
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid="text-forgot-confirmation"
                    >
                      If an account exists for{" "}
                      <span className="text-foreground font-medium">
                        {email}
                      </span>
                      , we've sent a password reset link. The link expires in 1
                      hour and can only be used once.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMode("login");
                        setForgotSent(false);
                      }}
                      data-testid="button-back-to-login"
                    >
                      Back to sign in
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "forgot" && (
                      <p className="text-sm text-muted-foreground">
                        Enter your email and we'll send you a link to set a new
                        password.
                      </p>
                    )}
                    {mode === "register" && (
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Name (optional)</Label>
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="Your name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          data-testid="input-display-name"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        data-testid="input-email"
                      />
                    </div>
                    {mode !== "forgot" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Password</Label>
                          {mode === "login" && (
                            <button
                              type="button"
                              onClick={() => {
                                setMode("forgot");
                                setForgotSent(false);
                              }}
                              className="text-xs text-primary hover:underline"
                              data-testid="link-forgot-password"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
                        <Input
                          id="password"
                          type="password"
                          required
                          placeholder={
                            mode === "register"
                              ? "At least 8 characters"
                              : "Your password"
                          }
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          data-testid="input-password"
                        />
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
                      data-testid="button-submit-auth"
                    >
                      {submitting && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {mode === "login"
                        ? "Sign In"
                        : mode === "register"
                          ? "Create Account"
                          : "Send Reset Link"}
                    </Button>
                    {mode === "forgot" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("login");
                          setForgotSent(false);
                        }}
                        className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
                        data-testid="link-back-to-login"
                      >
                        Back to sign in
                      </button>
                    )}
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
