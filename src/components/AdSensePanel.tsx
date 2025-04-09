
import React from "react";

interface AdSensePanelProps {
  adClient?: string;
  adSlot?: string;
  adFormat?: string;
  className?: string;
}

const AdSensePanel = ({ 
  adClient = "ca-pub-xxxxxxxxxxxxxxxx", 
  adSlot = "1234567890",
  adFormat = "auto",
  className = ""
}: AdSensePanelProps) => {
  return (
    <div className={`adsense-container ${className}`}>
      {/* AdSense script would be inserted here in production */}
      <div 
        className="bg-gray-100 border border-dashed border-gray-300 p-4 text-center text-gray-500 min-h-[250px] flex items-center justify-center"
        style={{ minWidth: "300px" }}
      >
        <div>
          <p className="font-medium">AdSense Panel</p>
          <p className="text-xs mt-2">Replace with actual AdSense code in production</p>
          <p className="text-xs mt-1">Format: {adFormat}, Slot: {adSlot}</p>
        </div>
      </div>
    </div>
  );
};

export default AdSensePanel;
