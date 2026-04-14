import React from "react";

interface AdSensePanelProps {
  adClient?: string;
  adSlot?: string;
  adFormat?: string;
  className?: string;
}

const AdSensePanel = ({ 
  adClient = import.meta.env.VITE_ADSENSE_CLIENT || "", 
  adSlot = import.meta.env.VITE_ADSENSE_SLOT || "",
  adFormat = "auto",
  className = ""
}: AdSensePanelProps) => {
  if (!adClient || !adSlot) {
    return null;
  }

  return (
    <div className={`adsense-container ${className}`}>
      <div 
        className="bg-muted border border-dashed border-border p-4 text-center text-muted-foreground min-h-[250px] flex items-center justify-center"
        style={{ minWidth: "300px" }}
      >
        <div>
          <p className="font-medium">AdSense Panel</p>
          <p className="text-xs mt-2">Format: {adFormat}, Slot: {adSlot}</p>
        </div>
      </div>
    </div>
  );
};

export default AdSensePanel;
