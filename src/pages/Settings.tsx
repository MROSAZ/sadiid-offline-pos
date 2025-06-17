import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ViewportContainer from '@/components/layouts/ViewportContainer';
import BusinessLocationSelector from '@/components/settings/BusinessLocationSelector';
import BusinessDetailsTest from '@/components/BusinessDetailsTest';

const Settings = () => {  return (
    <ViewportContainer>
      {/* Header - Fixed */}
      <h1 className="text-2xl font-bold mb-6 flex-shrink-0">Settings</h1>
      
      {/* Content - Scrollable */}
      <div className="flex-1 min-h-0">
        <Tabs defaultValue="general" className="h-full flex flex-col">
          <TabsList className="mb-4 flex-shrink-0">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="api-test">API Test</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 min-h-0 overflow-y-auto">
            <TabsContent value="general">
              <div className="space-y-6">
                <BusinessLocationSelector />
                {/* Other general settings */}
              </div>
            </TabsContent>
            
            <TabsContent value="business">
              {/* Business settings */}
            </TabsContent>

            <TabsContent value="api-test">
              <BusinessDetailsTest />
            </TabsContent>
            
            <TabsContent value="appearance">
              {/* Appearance settings */}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </ViewportContainer>
  );
};

export default Settings;