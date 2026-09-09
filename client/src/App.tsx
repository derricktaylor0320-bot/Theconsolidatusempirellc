import { Redirect, Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/useCart";
import { CompassNavigationProvider } from "@/hooks/useCompassNavigation";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import About from "@/pages/About";
import NumberThree from "@/pages/NumberThree";
import Canvas from "@/pages/Canvas";
import FR2P from "@/pages/FR2P";
import Apparel from "@/pages/Apparel";
import Feminine from "@/pages/Feminine";
import Masculine from "@/pages/Masculine";
import Accessories from "@/pages/Accessories";
import Bedding from "@/pages/Bedding";
import Elements from "@/pages/Elements";
import PocketBooster from "@/pages/PocketBooster";
import ExpenseRelief from "@/pages/ExpenseRelief";
import Invest from "@/pages/Invest";
import Hub from "@/pages/Hub";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutCancel from "@/pages/CheckoutCancel";
import LogoCustomizer from "@/pages/LogoCustomizer";
import Cart from "@/pages/Cart";
import ProductDetail from "@/pages/ProductDetail";
import Vintage from "@/pages/Vintage";
import Policies from "@/pages/Policies";
import HotDogs from "@/pages/HotDogs";
import Wine from "@/pages/Wine";
import Poetry from "@/pages/Poetry";
import Media from "@/pages/Media";
import VIP from "@/pages/VIP";
import AuthPage from "@/pages/AuthPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SsoDemo from "@/pages/SsoDemo";
import Orders from "@/pages/Orders";
import Profile from "@/pages/Profile";
import FootballTeams from "@/pages/FootballTeams";
import FuelPerks from "@/pages/FuelPerks";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import SiteVisitTracker from "@/components/SiteVisitTracker";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/number-three" component={NumberThree} />
      <Route path="/canvas" component={Canvas} />
      <Route path="/customize/:logoId" component={LogoCustomizer} />
      <Route path="/hub" component={Hub} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/sso-demo" component={SsoDemo} />
      <Route path="/orders" component={Orders} />
      <Route path="/profile" component={Profile} />
      <Route path="/fr2p" component={FR2P} />
      <Route path="/pathway">
        <Redirect to="/pocket-booster#building-blocks" replace />
      </Route>
      <Route path="/pocket-booster" component={PocketBooster} />
      <Route path="/expense-relief" component={ExpenseRelief} />
      <Route path="/out-of-pocket-booster" component={ExpenseRelief} />
      <Route path="/consolidated-expense-relief" component={ExpenseRelief} />
      <Route path="/invest" component={Invest} />
      <Route path="/fuel-perks" component={FuelPerks} />
      <Route path="/apparel" component={Apparel} />
      <Route path="/football-teams" component={FootballTeams} />
      <Route path="/feminine" component={Feminine} />
      <Route path="/masculine" component={Masculine} />
      <Route path="/accessories" component={Accessories} />
      <Route path="/bedding" component={Bedding} />
      <Route path="/elements" component={Elements} />
      <Route path="/cart" component={Cart} />
      <Route path="/product/:priceId" component={ProductDetail} />
      <Route path="/vintage" component={Vintage} />
      <Route path="/wine" component={Wine} />
      <Route path="/policies" component={Policies} />
      <Route path="/poetry" component={Poetry} />
      <Route path="/hot-dogs" component={HotDogs} />
      <Route path="/premium-choice-dogs" component={HotDogs} />
      <Route path="/media" component={Media} />
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
      <CartProvider>
        <CompassNavigationProvider>
          <TooltipProvider>
            <GoogleAnalytics />
            <SiteVisitTracker />
            <CookieConsentBanner />
            <Toaster />
            <Router />
          </TooltipProvider>
        </CompassNavigationProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
