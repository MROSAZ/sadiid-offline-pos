import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSales, markSaleAsSynced } from '@/lib/storage';
import { queueOperation } from '@/services/syncQueue';
import { useNetwork } from '@/context/NetworkContext';
import { useCart } from '@/context/CartContext';
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
import { getBusinessSettings } from '@/lib/businessSettings';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

const Sales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [businessSettings, setBusinessSettings] = useState(null);
  const { isOnline } = useNetwork();
  const navigate = useNavigate();
  const { clearCart, addItem, setCustomer, setEditingSale } = useCart();

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

  const handlePageChange = (page: number) => {
    loadSales(page);
  };
  const handleSync = async (sale: any) => {
    try {
      // Remove local properties before queuing
      const { local_id, is_synced, ...saleData } = sale;
      
      // Always queue the operation for sync (offline-first approach)
      await queueOperation('sale', { local_id, saleData });
      
      // Mark as synced locally since it's now queued
      await markSaleAsSynced(local_id);
      
      // Refresh data
      loadSales(pagination.page);
      
      // Show appropriate message based on network status
      if (isOnline) {
        toast.success('Sale queued for sync');
      } else {
        toast.success('Sale queued for sync when connection is restored');
      }
    } catch (error) {
      console.error('Error queuing sale for sync:', error);
      toast.error('Failed to queue sale for sync');
    }
  };
  const handleEditSale = (sale: any) => {
    clearCart();
    
    // Handle both local sales (sell_lines) and synced sales structure
    const saleLines = sale.sell_lines || [];
    
    if (saleLines.length === 0) {
      toast.warning('This sale has no items to edit');
      return;
    }
    
    saleLines.forEach((line: any) => {
      // Handle different product name sources
      const productName = line.product?.name || line.name || `Product ${line.product_id}`;
      const productSku = line.product?.sku || line.sku || '';
      
      addItem({
        product_id: line.product_id,
        variation_id: line.variation_id,
        name: productName,
        sku: productSku,
        price: parseFloat(line.unit_price_inc_tax || line.unit_price || 0),
        quantity: parseInt(line.quantity, 10),
        discount: parseFloat(line.line_discount_amount || 0),
        tax: parseFloat(line.item_tax || 0),
        total: parseFloat(line.unit_price_inc_tax || line.unit_price || 0) * parseInt(line.quantity, 10),
      });
    });
    
    if (sale.contact) {
      setCustomer(sale.contact);
    }
    
    setEditingSale(sale.local_id);
    navigate('/pos');
  };

  const handlePrintReceipt = (sale: any) => {
    // This is a placeholder for the actual receipt printing logic
    // You would typically generate a printable HTML receipt and open it in a new window
    const receiptContent = `
      <h1>Receipt for Sale #${sale.invoice_no || sale.local_id}</h1>
      <p>Date: ${new Date(sale.transaction_date).toLocaleString()}</p>
      <hr />
      <h2>Items:</h2>
      <ul>
        ${sale.sell_lines.map((item: any) => `<li>${item.product.name} - ${item.quantity} x ${formatAmount(item.unit_price_inc_tax)}</li>`).join('')}
      </ul>
      <hr />
      <h3>Total: ${formatAmount(sale.final_total)}</h3>
    `;
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(receiptContent);
    printWindow?.document.close();
    printWindow?.print();
    toast.info(`Printing receipt for sale #${sale.invoice_no || sale.local_id}`);
  };

  const handlePrintBill = (invoiceUrl: string) => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    }
  };

  // Create a formatter function - regular function, not using hooks
  const formatAmount = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return 'N/A';
    
    // Use sync version if available or default formatting
    if (businessSettings) {
      return formatCurrencySync(numericAmount, businessSettings);
    } else {
      // Fallback to simple formatting
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
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
          <p>Loading sales...</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.local_id}>
                  <TableCell>{sale.invoice_no || `Local-${sale.local_id}`}</TableCell>
                  <TableCell>{sale.contact?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(sale.transaction_date).toLocaleDateString()}</TableCell>
                  <TableCell>{formatAmount(sale.final_total)}</TableCell>
                  <TableCell>
                    {sale.is_synced === 1 && !sale.sync_error ? (
                      <Badge variant="success">Synced</Badge>
                    ) : sale.sync_error ? (
                      <Badge variant="destructive">Failed</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                    {sale.sync_error && <p className="text-xs text-red-500 mt-1">{sale.sync_error}</p>}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditSale(sale)}>
                          Edit Sale
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrintReceipt(sale)}>
                          Print Receipt
                        </DropdownMenuItem>
                        {sale.invoice_url && (
                          <DropdownMenuItem onClick={() => handlePrintBill(sale.invoice_url)}>
                            Print Bill
                          </DropdownMenuItem>
                        )}
                        {!sale.is_synced && !sale.sync_error && (
                           <DropdownMenuItem onClick={() => handleSync(sale)}>
                             Sync Now
                           </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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