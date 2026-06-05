import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Canvas from "@/pages/Canvas";
import FR2P from "@/pages/FR2P";
import Apparel from "@/pages/Apparel";
import Accessories from "@/pages/Accessories";
import PocketBooster from "@/pages/PocketBooster";
import ProspectIdentity from "@/pages/ProspectIdentity";
import Hub from "@/pages/Hub";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutCancel from "@/pages/CheckoutCancel";
import LogoCustomizer from "@/pages/LogoCustomizer";
import Vintage from "@/pages/Vintage";
import Policies from "@/pages/Policies";
import Poetry from "@/pages/Poetry";
import VIP from "@/pages/VIP";
import AuthPage from "@/pages/AuthPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/canvas" component={Canvas} />
      <Route path="/customize/:logoId" component={LogoCustomizer} />
      <Route path="/hub" component={Hub} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/fr2p" component={FR2P} />
      <Route path="/pocket-booster" component={PocketBooster} />
      <Route path="/prospect-identity" component={ProspectIdentity} />
      <Route path="/apparel" component={Apparel} />
      <Route path="/accessories" component={Accessories} />
      <Route path="/vintage" component={Vintage} />
      <Route path="/policies" component={Policies} />
      <Route path="/poetry" component={Poetry} />
      <Route path="/vip" component={VIP} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/checkout/cancel" component={CheckoutCancel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
