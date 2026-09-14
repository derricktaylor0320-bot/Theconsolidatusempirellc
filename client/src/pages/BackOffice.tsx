import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  Lock,
  MessageSquare,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandSectionBanner from "@/components/BrandSectionBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { CustomerFeedback } from "@shared/schema";

type BackOfficeOverview = {
  greeting: string;
  generatedAt: string;
  stats: {
    totalUsers: number;
    totalSubscribers: number;
    totalOrders: number;
    totalRevenueCents: number;
    uniqueVisitors7d: number;
    pageViews7d: number;
    pageViews30d: number;
    pendingFeedback: number;
    pocketBoosterMembers: number;
    expenseReliefMembers: number;
    activeInvestors: number;
  };
  apps: Array<{
    id: string;
    name: string;
    href: string;
    category: string;
    status: string;
    health: "ok" | "degraded" | "down";
    views7d: number;
  }>;
  topDestinations: Array<{ path: string; views: number }>;
  recentBuyers: Array<{
    id: string;
    customerEmail: string | null;
    customerName: string | null;
    totalCents: number;
    createdAt: string | null;
  }>;
  recentFeedback: CustomerFeedback[];
};

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function healthBadge(health: "ok" | "degraded" | "down") {
  if (health === "ok") {
    return (
      <Badge className="bg-emerald-600/90 hover:bg-emerald-600/90" data-testid="badge-health-ok">
        Working
      </Badge>
    );
  }
  if (health === "degraded") {
    return (
      <Badge variant="secondary" data-testid="badge-health-degraded">
        Low traffic / beta
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" data-testid="badge-health-down">
      Coming soon
    </Badge>
  );
}

export default function BackOffice() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch, isFetching } = useQuery<BackOfficeOverview>({
    queryKey: ["/api/back-office/overview"],
    queryFn: async () => {
      const res = await fetch("/api/back-office/overview", { credentials: "include" });
      if (res.status === 401) throw new Error("auth");
      if (res.status === 403) throw new Error("forbidden");
      if (!res.ok) throw new Error("Failed to load back office");
      return (await res.json()) as BackOfficeOverview;
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const updateFeedback = useMutation({
    mutationFn: async (input: { id: string; status: "new" | "in_progress" | "resolved" }) => {
      await apiRequest("PATCH", `/api/back-office/feedback/${input.id}`, {
        status: input.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/back-office/overview"] });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-16 text-center">
          <Lock className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="font-display text-3xl font-bold uppercase mb-3">
            Empire Back Office
          </h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Sign in with your owner account to manage The Consolidatus Empire from
            one command center.
          </p>
          <Button onClick={() => navigate("/auth")} data-testid="button-backoffice-signin">
            Sign In
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (error instanceof Error && error.message === "forbidden") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-16 text-center">
          <Lock className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="font-display text-3xl font-bold uppercase mb-3">
            Owner Access Only
          </h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            The Empire Back Office is reserved for Consolidatus Empire LLC owners.
            Signed in as <span className="font-semibold">{user?.email}</span>.
          </p>
          <Link href="/hub">
            <Button variant="outline">Return to Hub</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-10">
          <BrandSectionBanner compact />
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <LayoutDashboard className="h-6 w-6" />
                <span className="uppercase tracking-[0.25em] text-xs font-semibold">
                  Consolidatus Empire LLC
                </span>
              </div>
              <h1
                className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight"
                data-testid="text-backoffice-greeting"
              >
                {data?.greeting ?? "Welcome back"}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Your centralized back office — see what&apos;s working, who&apos;s
                visiting, who&apos;s buying, and what customers want more of.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Refresh
              </Button>
              <Link href="/hub">
                <Button variant="secondary">Centralized Hub</Button>
              </Link>
              <Link href="/orders">
                <Button>Manage Orders</Button>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" /> Visitors (7 days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="stat-unique-visitors">
                      {stats?.uniqueVisitors7d ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.pageViews7d ?? 0} page views this week
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" /> Buyers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="stat-orders">
                      {stats?.totalOrders ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatMoney(stats?.totalRevenueCents ?? 0)} revenue
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Interest
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="stat-subscribers">
                      {stats?.totalSubscribers ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      email subscribers · {stats?.totalUsers ?? 0} accounts
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Customer Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="stat-feedback">
                      {stats?.pendingFeedback ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      new feedback messages
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-3 mb-8">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Empire Apps — What&apos;s Working
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data?.apps.map((app) => (
                        <div
                          key={app.id}
                          className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                          data-testid={`row-app-${app.id}`}
                        >
                          <div>
                            <div className="font-medium">{app.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {app.category} · {app.views7d} visits (7d)
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {healthBadge(app.health)}
                            <Link href={app.href}>
                              <Button size="sm" variant="ghost" className="gap-1">
                                Open <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      Program Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span>Pocket Booster</span>
                      <span className="font-semibold">{stats?.pocketBoosterMembers ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expense Advantage</span>
                      <span className="font-semibold">{stats?.expenseReliefMembers ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Investors</span>
                      <span className="font-semibold">{stats?.activeInvestors ?? 0}</span>
                    </div>
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      {stats?.pageViews30d ?? 0} total page views in the last 30 days.
                      Pair with Google Analytics for deeper funnels.
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Buyers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data?.recentBuyers.length ? (
                      <div className="space-y-3">
                        {data.recentBuyers.map((buyer) => (
                          <div
                            key={buyer.id}
                            className="rounded-lg border border-border/60 p-3 text-sm"
                          >
                            <div className="font-medium">
                              {buyer.customerName || buyer.customerEmail || "Guest"}
                            </div>
                            <div className="text-muted-foreground">
                              {formatMoney(buyer.totalCents)} · {formatDate(buyer.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No paid orders yet.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Customer Feedback Inbox</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data?.recentFeedback.length ? (
                      <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
                        {data.recentFeedback.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-border/60 p-3 text-sm space-y-2"
                            data-testid={`feedback-${item.id}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-medium">
                                  {item.interestArea || "General feedback"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.email || "Anonymous"} · {formatDate(item.createdAt)}
                                </div>
                              </div>
                              <Badge variant={item.status === "new" ? "default" : "secondary"}>
                                {item.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{item.message}</p>
                            {item.status !== "resolved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                disabled={updateFeedback.isPending}
                                onClick={() =>
                                  updateFeedback.mutate({
                                    id: item.id,
                                    status: "resolved",
                                  })
                                }
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Mark resolved
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No feedback yet. The form on the Hub collects what people want
                        more of.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
