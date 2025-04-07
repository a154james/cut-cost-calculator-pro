
import { Calculator } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-primary py-4 px-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calculator size={24} className="text-primary-foreground" />
          <h1 className="text-xl font-bold text-primary-foreground">CNC Machining Cost Calculator Pro</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
