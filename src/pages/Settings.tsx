import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Settings = () => {
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <div className="space-y-6">
            <p>General settings will go here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="business">
          <p>Business settings will go here</p>
        </TabsContent>
        
        <TabsContent value="appearance">
          <p>Appearance settings will go here</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;