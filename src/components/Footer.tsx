
import { Button } from "@/components/ui/button";
import GDPRModal from "./GDPRModal";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 text-center">
      <p className="text-sm">
        Appreciate this calculator? <Button variant="link" className="text-blue-400 p-0 h-auto">Donate to support</Button>
      </p>
      <div className="flex justify-center gap-4 mt-2">
        <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">Feedback</Button>
        <GDPRModal />
      </div>
      <p className="text-xs mt-2">© {new Date().getFullYear()} CNC Machining Cost Calculator Pro</p>
    </footer>
  );
};

export default Footer;
