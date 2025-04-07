
import MachiningCalculator from "@/components/MachiningCalculator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <MachiningCalculator />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
