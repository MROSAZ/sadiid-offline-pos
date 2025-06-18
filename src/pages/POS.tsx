import React, { useEffect, useRef, useState } from 'react';
import { Menu, Table, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandInput } from '@/components/ui/command';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ViewportContainer from '@/components/layouts/ViewportContainer';
import POSProductGrid from '@/components/pos/POSProductGrid';
import POSOrderDetails from '../components/pos/POSOrderDetails';
import POSCategoryFilters from '../components/pos/POSCategoryFilters';

const POS = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Focus search input when page loads and on key press
  useEffect(() => {
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
  };  return (
    <ViewportContainer padding={false}>
      <TooltipProvider>
        <div className="h-full w-full flex">
          {/* Products Panel */}
          <div className="flex-1 h-full flex flex-col bg-white">            {/* Search and Menu Bar - Fixed */}
            <div className="viewport-header p-4 border-b bg-white w-full min-w-0">
              <div className="flex items-center gap-4 mb-4 w-full min-w-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-500">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Menu</p>
                  </TooltipContent>
                </Tooltip>                
                <div className="flex-1 min-w-0">
                  <Command className="rounded-lg border shadow-md">
                    <CommandInput 
                      ref={searchInputRef}
                      placeholder="Search all products here..."
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                  </Command>
                </div>
                
                <ToggleGroup 
                  type="single" 
                  value={viewMode} 
                  onValueChange={(value) => value && setViewMode(value as 'grid' | 'table')}
                  className="border rounded-md"
                >
                  <ToggleGroupItem value="grid" aria-label="Grid view" size="sm">
                    <Grid3X3 className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="table" aria-label="Table view" size="sm">
                    <Table className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>              
              {/* Category Filters */}
              <div className="w-full min-w-0">
                <POSCategoryFilters 
                  onCategoryChange={setSelectedCategoryId}
                  selectedCategoryId={selectedCategoryId}
                />
              </div>
            </div>
            
            {/* Products Grid - Scrollable Area */}
            <div className="flex-1 min-h-0 p-4">
              <POSProductGrid 
                searchTerm={searchTerm} 
                categoryId={selectedCategoryId}
                viewMode={viewMode}
              />
            </div>
          </div>

          {/* Cart Panel */}
          <div className="w-96 h-full border-l bg-white">
            <POSOrderDetails />
          </div>
        </div>
      </TooltipProvider>
    </ViewportContainer>
  );
};

export default POS;
