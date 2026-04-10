
import MachiningCalculator from "@/components/MachiningCalculator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdSensePanel from "@/components/AdSensePanel";
import CookieConsentPopup from "@/components/CookieConsentPopup";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <AdSensePanel className="mb-6" />
        <MachiningCalculator />
      </main>
      <Footer />
      <CookieConsentPopup />
    </div>
  );
};

export default Index;
