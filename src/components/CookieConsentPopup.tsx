
import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const CookieConsentPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if cookie consent has been given already
    const hasConsent = localStorage.getItem("cookie-consent");
    if (!hasConsent) {
      // Wait a short time before showing the popup for better UX
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem("cookie-consent", "all");
    localStorage.setItem("cookie-consent-timestamp", new Date().toISOString());
    setOpen(false);
  };

  const acceptRequired = () => {
    localStorage.setItem("cookie-consent", "required");
    localStorage.setItem("cookie-consent-timestamp", new Date().toISOString());
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Cookie Consent
          </AlertDialogTitle>
          <AlertDialogDescription>
            This website uses cookies to enhance your experience and provide essential functionality. 
            We also use cookies for analytics and advertising purposes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Required cookies are necessary for the basic functionality of this website. 
            Optional cookies help us improve our website by collecting anonymous information.
          </p>
        </div>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={acceptRequired}>
              Accept Required Only
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={acceptAll}>
              Accept All Cookies
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CookieConsentPopup;
