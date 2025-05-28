import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BusinessLocationSelector from '@/components/settings/BusinessLocationSelector';
import BusinessDetailsTest from '@/components/BusinessDetailsTest';

const Settings = () => {
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="api-test">API Test</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
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
      </Tabs>
    </div>
  );
};

export default Settings;