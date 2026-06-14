import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, ShoppingBag, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";

export default function CheckoutSuccess() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-24 flex items-center justify-center">
        <motion.div 
          className="max-w-lg text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
          </div>
          
          <h1 
            className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight mb-4"
            data-testid="text-success-title"
          >
            Order Confirmed
          </h1>
          
          <p 
            className="text-lg text-muted-foreground mb-8"
            data-testid="text-success-message"
          >
            Thank you for your purchase! Your order has been placed successfully.
          </p>
          
          <div className="bg-muted/30 rounded-xl p-6 mb-8 border border-primary/10">
            <div className="flex items-center gap-3 text-left">
              <Mail className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                A confirmation email with your order details will be sent to you shortly.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apparel">
              <Button 
                className="w-full sm:w-auto bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
                data-testid="button-continue-shopping"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
            <Link href="/">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto uppercase tracking-wider font-display border-primary/20"
                data-testid="button-return-home"
              >
                Return Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
