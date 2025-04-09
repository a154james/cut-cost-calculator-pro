
import MachiningCalculator from "@/components/MachiningCalculator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdSensePanel from "@/components/AdSensePanel";
import CookieConsentPopup from "@/components/CookieConsentPopup";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <MachiningCalculator />
          </div>
          <div className="lg:col-span-1">
            <AdSensePanel className="sticky top-6" />
          </div>
        </div>
      </main>
      <Footer />
      <CookieConsentPopup />
    </div>
  );
};

export default Index;
