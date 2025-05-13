
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { getContacts } from '@/services/storage';
import { useNetwork } from '@/context/NetworkContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Mail, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface Customer {
  id: number;
  name: string;
  email?: string;
  mobile?: string;
  type: string;
  contact_status?: string;
  [key: string]: any;
}

interface CustomerListProps {
  searchQuery?: string;
  status?: string;
}

const CustomerList = ({ searchQuery = '', status }: CustomerListProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const { isOnline } = useNetwork();

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers(searchQuery, status);
  }, [searchQuery, status, customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getContacts();
      setCustomers(data || []);
      filterCustomers(searchQuery, status);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = (query: string, statusFilter?: string) => {
    if (!customers.length) {
      setFilteredCustomers([]);
      return;
    }

    let filtered = [...customers];
    
    // Apply status filter if provided
    if (statusFilter) {
      filtered = filtered.filter(customer => customer.contact_status === statusFilter);
    }

    // Apply search query if provided
    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name?.toLowerCase().includes(lowerCaseQuery) ||
        customer.email?.toLowerCase().includes(lowerCaseQuery) ||
        customer.mobile?.toLowerCase().includes(lowerCaseQuery)
      );
    }

    setFilteredCustomers(filtered);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {Array(3).fill(0).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredCustomers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-16 w-16 mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
        <p className="text-gray-500 mt-1">
          {searchQuery ? `No customers match "${searchQuery}"` : 'No customers available yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Customer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCustomers.map((customer) => (
            <TableRow key={customer.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    {customer.business_name && (
                      <p className="text-sm text-gray-500">{customer.business_name}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {customer.mobile && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-3.5 w-3.5 mr-2 text-gray-500" />
                      <span>{customer.mobile}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-3.5 w-3.5 mr-2 text-gray-500" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                  {customer.type || 'Customer'}
                </div>
              </TableCell>
              <TableCell>
                <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none
                  ${customer.contact_status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'}`}>
                  {customer.contact_status || 'Unknown'}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CustomerList;
