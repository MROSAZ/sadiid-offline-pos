
import { useEffect, useState } from 'react';
import { useCustomer, Customer } from '@/context/CustomerContext';
import { Button } from '@/components/ui/button';
import { Loader, Search, RefreshCw, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNetwork } from '@/context/NetworkContext';

interface CustomerListProps {
  searchQuery?: string;
  status?: string;
}

const CustomerList = ({ searchQuery = '', status }: CustomerListProps) => {
  const { customers, isLoading, refreshCustomers } = useCustomer();
  const { isOnline } = useNetwork();
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [localSearch, setLocalSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Handle search and filtering
  useEffect(() => {
    const query = localSearch || searchQuery;
    let filtered = [...customers];
    
    // Filter by search query
    if (query) {
      filtered = filtered.filter((customer) => 
        customer.name?.toLowerCase().includes(query.toLowerCase()) || 
        customer.mobile?.includes(query) ||
        customer.email?.toLowerCase().includes(query.toLowerCase()) ||
        customer.contact_id?.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Filter by status
    if (status) {
      filtered = filtered.filter((customer) => 
        customer.contact_status === status
      );
    }
    
    setFilteredCustomers(filtered);
  }, [customers, localSearch, searchQuery, status]);

  // Handle refresh
  const handleRefresh = async () => {
    if (!isOnline) return;
    
    setRefreshing(true);
    await refreshCustomers();
    setRefreshing(false);
  };

  // If global loading state is active
  if (isLoading && !refreshing) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="h-8 w-8 animate-spin text-sadiid-600" />
        <span className="ml-2">Loading customers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8 w-full"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={!isOnline || refreshing}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-md">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search or filter to find what you are looking for.' 
              : 'Get started by adding a new customer.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3 border-b border-gray-200">Name</th>
                <th className="px-6 py-3 border-b border-gray-200">Contact</th>
                <th className="px-6 py-3 border-b border-gray-200">Address</th>
                <th className="px-6 py-3 border-b border-gray-200">Status</th>
                <th className="px-6 py-3 border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-sadiid-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-sadiid-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.contact_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{customer.mobile || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{customer.email || 'No email'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {customer.address_line_1 ? `${customer.address_line_1}` : 'No address'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {customer.city && customer.state ? `${customer.city}, ${customer.state}` : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      customer.contact_status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.contact_status || 'unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Button variant="ghost" size="sm">View</Button>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
