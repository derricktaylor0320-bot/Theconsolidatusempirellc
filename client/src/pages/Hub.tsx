import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandSectionBanner from "@/components/BrandSectionBanner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Shirt,
  Watch,
  Landmark,
  Feather,
  Palette,
  TrendingUp,
  Rocket,
  Beef,
  Music,
  LogIn,
  CheckCircle2,
} from "lucide-react";
import logo from "@assets/generated_images/consolidatus_empire_logo_2020.png";

type AppNode = { href: string; label: string; Icon: typeof Shirt };

const APPS: AppNode[] = [
  { href: "/apparel", label: "Apparel", Icon: Shirt },
  { href: "/accessories", label: "Accessories", Icon: Watch },
  { href: "/vintage", label: "Vintage Baltimore", Icon: Landmark },
  { href: "/poetry", label: "Poetry on a Plaque", Icon: Feather },
  { href: "/hot-dogs", label: "Hot Dogs", Icon: Beef },
  { href: "/media", label: "Media & Music", Icon: Music },
  { href: "/canvas", label: "Logo Collection", Icon: Palette },
  { href: "/pocket-booster", label: "Pocket Booster", Icon: Rocket },
  { href: "/fr2p", label: "FR2P Club", Icon: TrendingUp },
];

function fibonacciSphere(n: number) {
  const pts: { x: number; y: number; z: number }[] = [];
  const inc = Math.PI * (3 - Math.sqrt(5));
  const off = 2 / n;
  for (let i = 0; i < n; i++) {
    const y = i * off - 1 + off / 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * inc;
    pts.push({ x: Math.cos(phi) * r, y, z: Math.sin(phi) * r });
  }
  return pts;
}

export default function Hub() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [angle, setAngle] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const pausedRef = useRef(false);
  const points = useRef(fibonacciSphere(APPS.length));

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      if (!pausedRef.current && document.visibilityState === "visible") {
        setAngle((a) => a + dt * 0.35);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const R = 190;
  const PERSP = 700;
  const TILT = -0.35;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const cosT = Math.cos(TILT);
  const sinT = Math.sin(TILT);

  const nodes = points.current
    .map((p, i) => {
      let x = p.x * cosA - p.z * sinA;
      let z = p.x * sinA + p.z * cosA;
      let y = p.y;
      const yT = y * cosT - z * sinT;
      const zT = y * sinT + z * cosT;
      y = yT;
      z = zT;
      const scale = PERSP / (PERSP - z * R);
      return { ...APPS[i], left: x * R * scale, top: y * R * scale, z, scale };
    })
    .sort((a, b) => a.z - b.z);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-4 py-12 relative z-10 text-center">
          <BrandSectionBanner compact />
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tight"
            data-testid="text-hub-title"
          >
            The Consolidatus <span className="text-primary">Empire</span>
          </motion.h1>
          <p
            className="text-muted-foreground mt-3 mb-6 uppercase tracking-[0.3em] text-xs md:text-sm"
            data-testid="text-hub-subtitle"
          >
            Centralized Hub — Tap an orb to enter
          </p>

          {!isLoading && (
            <div className="mb-8 flex justify-center">
              {isAuthenticated ? (
                <div
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm"
                  data-testid="status-hub-signed-in"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>
                    Signed in as{" "}
                    <span className="font-semibold text-primary">
                      {user?.displayName || user?.email}
                    </span>{" "}
                    — your session carries across the hub
                  </span>
                </div>
              ) : (
                <div
                  className="inline-flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-primary/20 bg-background/60 px-5 py-3"
                  data-testid="status-hub-signed-out"
                >
                  <span className="text-sm text-muted-foreground">
                    Sign in once to unlock a connected experience across every
                    app.
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setLocation("/auth")}
                    className="bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display gap-2"
                    data-testid="button-hub-signin"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          )}

          <div
            className="relative mx-auto"
            style={{ width: "100%", maxWidth: 620, height: 540 }}
            onMouseEnter={() => {
              pausedRef.current = true;
            }}
            onMouseLeave={() => {
              pausedRef.current = false;
              setHovered(null);
            }}
            data-testid="container-hub-sphere"
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-pulse" />
                <div className="absolute w-44 h-44 rounded-full border border-primary/20" />
                <div className="absolute w-60 h-60 rounded-full border border-primary/10" />
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/40 to-primary/5 backdrop-blur flex items-center justify-center border border-primary/40 shadow-[0_0_40px_rgba(212,175,55,0.35)]">
                  <img
                    src={logo}
                    alt="Consolidatus Empire"
                    className="w-16 h-16 object-contain drop-shadow"
                  />
                </div>
              </div>
            </div>

            {nodes.map((n) => {
              const depth = (n.z + 1) / 2;
              const opacity = 0.35 + depth * 0.65;
              const isHover = hovered === n.href;
              const Icon = n.Icon;
              return (
                <button
                  key={n.href}
                  onClick={() => setLocation(n.href)}
                  onMouseEnter={() => setHovered(n.href)}
                  onMouseLeave={() => setHovered(null)}
                  className="absolute left-1/2 top-1/2 flex flex-col items-center gap-1.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  style={{
                    transform: `translate(-50%, -50%) translate(${n.left}px, ${n.top}px) scale(${
                      isHover ? n.scale * 1.25 : n.scale
                    })`,
                    zIndex: Math.round((n.z + 1) * 100),
                    opacity,
                  }}
                  data-testid={`node-app-${n.href.replace(/\//g, "")}`}
                >
                  <span
                    className={`flex items-center justify-center w-14 h-14 rounded-full border transition-colors ${
                      isHover
                        ? "bg-primary text-black border-primary"
                        : "bg-background/80 text-primary border-primary/40"
                    } shadow-[0_0_20px_rgba(212,175,55,0.25)]`}
                  >
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className="text-[10px] md:text-xs font-display uppercase tracking-wider whitespace-nowrap text-foreground/90 bg-background/60 px-2 py-0.5 rounded">
                    {n.label}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-muted-foreground text-sm mt-6">
            One command center for every Khomplete Khemistri app. Hover to pause,
            click any orb to launch.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
