
import { Calculator, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

const Header = () => {
  const { isDark, toggle } = useTheme();

  return (
    <header className="bg-primary py-4 px-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <Calculator size={20} className="text-primary-foreground flex-shrink-0 sm:w-6 sm:h-6" />
          <h1 className="text-sm sm:text-lg md:text-xl font-bold text-primary-foreground truncate">
            <span className="sm:hidden">CNC Calculator Pro</span>
            <span className="hidden sm:inline">CNC Machining Cost Calculator Pro</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon" onClick={toggle} aria-label="Toggle dark mode">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <div className="hidden sm:block">
            <a href="https://github.com/yourusername/cnc-calculator" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">View on GitHub</Button>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
