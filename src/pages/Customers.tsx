import { useState } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ViewportContainer from '@/components/layouts/ViewportContainer';
import CustomerList from '@/components/customers/CustomerList';
import { useNetwork } from '@/context/NetworkContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NetworkStatusIndicator from '@/components/NetworkStatusIndicator';

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { isOnline } = useNetwork();

  return (
    <ViewportContainer>
      {/* Header - Fixed */}
      <div className="viewport-header mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-sadiid-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
              <p className="text-sm text-gray-500">Manage your customer database</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                type="search" 
                placeholder="Search customers..." 
                className="pl-8 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="bg-sadiid-600 hover:bg-sadiid-700">
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Customer</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 min-h-0 bg-white rounded-lg shadow">
        <div className="viewport-header p-4 border-b border-gray-200 flex items-center justify-between">
          <NetworkStatusIndicator showText />
        </div>
        
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="all" className="h-full flex flex-col">
            <div className="viewport-header px-4 pt-4">
              <TabsList>
                <TabsTrigger value="all">All Customers</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0">
              <TabsContent value="all" className="h-full m-0">
                <ScrollArea className="h-full">
                  <CustomerList searchQuery={searchQuery} />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="active" className="h-full m-0">
                <ScrollArea className="h-full">
                  <CustomerList searchQuery={searchQuery} status="active" />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="inactive" className="h-full m-0">
                <ScrollArea className="h-full">
                  <CustomerList searchQuery={searchQuery} status="inactive" />
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </ViewportContainer>
  );
};

export default Customers;
