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
  const { clearCart, addItem, setCustomer, setEditingSale, setEditingServerId } = useCart();

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
  };  const handleSync = async (sale: any) => {
    try {
      // Remove local properties before queuing
      const { local_id, is_synced, sync_error, ...saleData } = sale;
      
      // Use the sale's primary key (local_id or id) for sync
      const saleKey = sale.local_id || sale.id;
      
      // Always queue the operation for sync (offline-first approach)
      await queueOperation('sale', { local_id: saleKey, saleData });
      
      // Mark as queued for sync
      await markSaleAsSynced(saleKey);
      
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
  };const handleEditSale = async (sale: any) => {
    try {
      clearCart();
      
      // Handle both local sales (products) and synced sales (sell_lines) structure
      const saleItems = sale.products || sale.sell_lines || [];
      
      if (!saleItems || saleItems.length === 0) {
        toast.warning('This sale has no items to edit');
        return;
      }
      
      // Load products data to get product names
      const { getProducts } = await import('@/lib/storage');
      const allProducts = await getProducts();
      
      saleItems.forEach((item: any) => {
        // Try to find product info from stored products
        const productInfo = allProducts.find(p => p.id === item.product_id);
        
        // Handle different product name sources with fallbacks
        const productName = item.product?.name || 
                           productInfo?.name || 
                           item.name || 
                           `Product ${item.product_id}`;
        const productSku = item.product?.sku || 
                          productInfo?.sku || 
                          item.sku || 
                          '';
        
        // Handle different price field names between local and synced sales
        const unitPrice = item.unit_price_inc_tax || 
                         item.unit_price || 
                         item.price || 
                         0;
        
        addItem({
          product_id: item.product_id,
          variation_id: item.variation_id,
          name: productName,
          sku: productSku,
          price: parseFloat(unitPrice),
          quantity: parseFloat(item.quantity) || 1,
          discount: parseFloat(item.line_discount_amount || item.discount_amount || 0),
          tax: parseFloat(item.item_tax || item.tax_amount || 0),
          total: parseFloat(unitPrice) * (parseFloat(item.quantity) || 1),
        });
      });
      
      // Set customer if available
      if (sale.contact) {
        setCustomer(sale.contact);
      }
      
      // Set editing mode with the proper IDs
      // For synced sales: use server ID for API calls, local_id for local storage
      // For local sales: use local_id for both
      const localId = sale.local_id || sale.id; // For local storage operations
      const serverId = sale.id; // For API calls (null for local-only sales)
      
      setEditingSale(localId);
      
      // Store the server ID in cart context for API operations if available
      if (serverId) {
        setEditingServerId(serverId);
      } else {
        setEditingServerId(null);
      }
      
      navigate('/pos');
      toast.success('Sale loaded for editing');
    } catch (error) {
      console.error('Error loading sale for editing:', error);
      toast.error('Failed to load sale for editing');
    }
  };
  const handlePrintReceipt = (sale: any) => {
    try {
      // Generate HTML receipt content - handle both local and synced sales
      const saleItems = sale.products || sale.sell_lines || [];
      const itemsHtml = saleItems.map((item: any) => {
        const productName = item.product?.name || item.name || `Product ${item.product_id}`;
        const quantity = item.quantity || 1;
        const price = item.unit_price_inc_tax || item.unit_price || item.price || 0;
        return `<li>${productName} - ${quantity} x ${formatAmount(price)}</li>`;
      }).join('');

      const receiptContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - Sale #${sale.invoice_no || sale.local_id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            hr { border: 1px solid #ccc; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 5px 0; }
            .total { font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <h1>Receipt for Sale #${sale.invoice_no || sale.local_id}</h1>
          <p><strong>Date:</strong> ${new Date(sale.transaction_date).toLocaleString()}</p>
          <p><strong>Customer:</strong> ${sale.contact?.name || 'Walk-in Customer'}</p>
          <hr />
          <h2>Items:</h2>
          <ul>${itemsHtml}</ul>
          <hr />
          <p class="total">Total: ${formatAmount(sale.final_total)}</p>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.print();
        toast.success(`Receipt opened for printing`);
      } else {
        toast.error('Unable to open print window. Please check popup blocker settings.');
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    }
  };
  const handlePrintBill = (invoiceUrl: string) => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
      toast.success('Official bill opened in new window');
    } else {
      toast.error('Invoice URL not available');
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
                            Print Official Bill
                          </DropdownMenuItem>
                        )}
                        {(!sale.is_synced || sale.sync_error) && (
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