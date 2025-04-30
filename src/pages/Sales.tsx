import React, { useEffect, useState } from 'react';
import { getSales, markSaleAsSynced } from '@/services/storage';
import { createSale } from '@/services/api';
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

const Sales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const { isOnline } = useNetwork();
  const businessSettings = {}; // Placeholder for business settings

  const loadSales = async (page = 1) => {
    setLoading(true);
    try {
      const result = await getSales(page, pagination.limit);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handlePageChange = (page: number) => {
    loadSales(page);
  };

  const handleSync = async (sale: any) => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    try {
      // Remove local properties before sending
      const { local_id, is_synced, ...saleData } = sale;
      
      // Send to server
      await createSale(saleData);
      
      // Mark as synced locally
      await markSaleAsSynced(local_id);
      
      // Refresh data
      loadSales(pagination.page);
      
      toast.success('Sale synced successfully');
    } catch (error) {
      console.error('Error syncing sale:', error);
      toast.error('Failed to sync sale');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales History</h1>
        <Button 
          onClick={() => loadSales(pagination.page)}
          variant="outline"
        >
          Refresh
        </Button>
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
                        {React.useMemo(() => {
                          if (!sale.payment || !sale.payment[0]) return 'N/A';
                          
                          // Use sync version if available or default formatting
                          if (typeof formatCurrencySync === 'function' && businessSettings) {
                            return formatCurrencySync(sale.payment[0].amount, businessSettings);
                          } else {
                            // Fallback to simple formatting
                            return `$${parseFloat(sale.payment[0].amount).toFixed(2)}`;
                          }
                        }, [sale.payment])}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.is_synced ? "success" : "destructive"}>
                          {sale.is_synced ? 'Synced' : 'Not Synced'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!sale.is_synced && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={!isOnline}
                            onClick={() => handleSync(sale)}
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