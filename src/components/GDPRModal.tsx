
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Cookie, Info } from "lucide-react";

const GDPRModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="h-4 w-4 mr-1" />
          Privacy & GDPR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy and Data Protection Information
          </DialogTitle>
          <DialogDescription>
            Information about how we handle your data and comply with GDPR regulations.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="cookies">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="cookies">
              <Cookie className="h-4 w-4 mr-1" /> Cookies
            </TabsTrigger>
            <TabsTrigger value="privacy">Data Processing</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="max-h-[60vh] mt-4">
            <TabsContent value="cookies" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Cookie Usage</h3>
                <p className="text-sm text-muted-foreground">
                  This website uses cookies to enhance your experience and provide essential functionality.
                </p>
                
                <div className="mt-4 space-y-3">
                  <div className="bg-muted/50 p-3 rounded-md">
                    <h4 className="font-medium">Required Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      These cookies are necessary for the website to function and cannot be disabled. They are usually set in response to actions you take such as setting preferences, logging in, or filling in forms.
                    </p>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-md">
                    <h4 className="font-medium">Analytics Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are popular and see how visitors move around the site.
                    </p>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-md">
                    <h4 className="font-medium">Advertising Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="privacy" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Data Processing Information</h3>
                <p className="text-sm text-muted-foreground">
                  We take your privacy seriously and are committed to protecting your personal data. Here's information about how we process your data:
                </p>
                
                <div className="space-y-3 mt-4">
                  <div>
                    <h4 className="font-medium">Data Controller</h4>
                    <p className="text-sm text-muted-foreground">
                      CNC Machining Cost Calculator Pro is the data controller responsible for your personal data.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">What Data We Collect</h4>
                    <p className="text-sm text-muted-foreground">
                      We collect minimal data necessary to provide our calculation services. This may include:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1">
                      <li>Technical data (IP address, browser information)</li>
                      <li>Usage data (how you use our website)</li>
                      <li>Calculation data you input (not personally identifiable)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Your Rights</h4>
                    <p className="text-sm text-muted-foreground">
                      Under GDPR, you have rights including: access to your data, correction of your data, erasure of your data, restriction of processing, data portability, and objection to processing.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Privacy Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Customize your privacy preferences below. Note that disabling required cookies may affect the functionality of the website.
                </p>
                
                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                    <div>
                      <h4 className="font-medium">Required Cookies</h4>
                      <p className="text-sm text-muted-foreground">Necessary for the website to function properly</p>
                    </div>
                    <div className="italic text-sm text-muted-foreground">Always enabled</div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                    <div>
                      <h4 className="font-medium">Analytics</h4>
                      <p className="text-sm text-muted-foreground">Help us improve by tracking anonymous usage</p>
                    </div>
                    <Button variant="outline" size="sm">Disable</Button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                    <div>
                      <h4 className="font-medium">Marketing</h4>
                      <p className="text-sm text-muted-foreground">Show personalized advertisements</p>
                    </div>
                    <Button variant="outline" size="sm">Disable</Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <DialogFooter>
          <Button type="button">Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GDPRModal;
