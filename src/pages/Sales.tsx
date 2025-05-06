import React, { useEffect, useState } from 'react'; 
import { useNetwork } from '@/context/NetworkContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrencySync } from '@/utils/formatting';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useSales } from '@/hooks/repository/useSales';
import { SaleRecord } from '@/repositories/interfaces/ISaleRepository';
import { getBusinessSettings } from '@/services/storage';

const Sales = () => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const { isOnline } = useNetwork();
  const { loading, error, getPaginatedSales, syncSale, syncAllUnsynced } = useSales();

  // Load business settings at component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getBusinessSettings();
        setBusinessSettings(settings);
      } catch (error) {
        console.error('Error loading business settings:', error);
      }
    };
    
    fetchSettings();
    loadSales(); // Moved loadSales here to avoid multiple useEffect hooks
  }, []);

  // Show errors from the repository
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  const loadSales = async (page = 1) => {
    try {
      const result = await getPaginatedSales(page, pagination.limit);
      setSales(result.data);
      setPagination({
        ...pagination,
        page: result.page,
        total: result.total,
        totalPages: result.totalPages
      });
    } catch (error) {
      console.error('Error loading sales:', error);
      toast.error('Failed to load sales');
    }
  };

  const handlePageChange = (page: number) => {
    loadSales(page);
  };

  const handleSync = async (saleId: number) => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    try {
      const success = await syncSale(saleId);
      
      if (success) {
        // Refresh data
        loadSales(pagination.page);
        toast.success('Sale synced successfully');
      } else {
        toast.error('Failed to sync sale');
      }
    } catch (error) {
      console.error('Error syncing sale:', error);
      toast.error('Failed to sync sale');
    }
  };

  const handleSyncAll = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    try {
      const count = await syncAllUnsynced();
      
      // Refresh data
      loadSales(pagination.page);
      
      if (count > 0) {
        toast.success(`${count} sales synced successfully`);
      } else {
        toast.info('No sales to sync');
      }
    } catch (error) {
      console.error('Error syncing sales:', error);
      toast.error('Failed to sync sales');
    }
  };

  // Create a formatter function - regular function, not using hooks
  const formatAmount = (payment: any) => {
    if (!payment || !payment[0]) return 'N/A';
    
    // Use sync version if available or default formatting
    if (typeof formatCurrencySync === 'function' && businessSettings) {
      return formatCurrencySync(payment[0].amount, businessSettings);
    } else {
      // Fallback to simple formatting
      return `$${parseFloat(payment[0].amount).toFixed(2)}`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales History</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleSyncAll}
            variant="outline"
            disabled={!isOnline || loading}
          >
            Sync All
          </Button>
          <Button 
            onClick={() => loadSales(pagination.page)}
            variant="outline"
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sadiid-600"></div>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length > 0 ? (
                  sales.map((sale) => (
                    <TableRow key={sale.local_id}>
                      <TableCell>{sale.local_id}</TableCell>
                      <TableCell>
                        {new Date(sale.transaction_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {sale.customer_id || 'Walk-in Customer'}
                      </TableCell>
                      <TableCell>
                        {formatAmount(sale.payment)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.is_synced ? "success" : "destructive"}>
                          {sale.is_synced ? 'Synced' : 'Not Synced'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!sale.is_synced && sale.local_id && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={!isOnline || loading}
                            onClick={() => handleSync(sale.local_id!)}
                          >
                            Sync
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                      No sales found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {pagination.totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))} 
                    className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({length: pagination.totalPages}).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={pagination.page === i + 1}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                    className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default Sales;