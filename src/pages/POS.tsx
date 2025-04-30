import React, { useEffect, useRef, useState } from 'react';
import { Search, Menu, Table, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import POSProductGrid from '@/components/pos/POSProductGrid';
import POSOrderDetails from '../components/pos/POSOrderDetails';
import POSCategoryFilters from '../components/pos/POSCategoryFilters';

const POS = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Focus search input when page loads and on key press
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputActive = activeElement instanceof HTMLInputElement || 
                           activeElement instanceof HTMLTextAreaElement;
      
      if (!isInputActive && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-4">
          {/* Products Section (3/4 width on large screens) */}
          <div className="lg:col-span-3 p-4 border-r border-gray-200">
            {/* Search and Menu Bar */}
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" className="text-gray-500">
                <Menu className="h-6 w-6" />
              </Button>
              
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search all products here..."
                  className="flex-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
              
              <Button variant="ghost" size="icon" className="text-gray-500">
                <Table className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Category Filters */}
            <POSCategoryFilters 
              onCategoryChange={setSelectedCategoryId}
              selectedCategoryId={selectedCategoryId}
            />
            
            {/* Products Grid - Pass search term and category ID */}
            <POSProductGrid 
              searchTerm={searchTerm} 
              categoryId={selectedCategoryId}
            />
          </div>
          
          {/* Order Details Section */}
          <div className="lg:col-span-1 p-4 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Order Details</h2>
              <Button variant="ghost" size="icon" className="text-gray-700">
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <POSOrderDetails />
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
