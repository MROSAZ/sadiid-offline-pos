import React, { useEffect, useRef, useState } from 'react';
import { Search, Menu, Table, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandInput } from '@/components/ui/command';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    <TooltipProvider>
      <div className="h-screen bg-gray-50 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Products Panel */}
          <ResizablePanel defaultSize={75} minSize={60}>
            <div className="p-4 h-full flex flex-col bg-white overflow-hidden">
              {/* Search and Menu Bar */}
              <div className="flex items-center gap-4 mb-4">
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
                
                <div className="flex-1">
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
              <POSCategoryFilters 
                onCategoryChange={setSelectedCategoryId}
                selectedCategoryId={selectedCategoryId}
              />
              
              {/* Products Grid */}
              <div className="flex-1 overflow-hidden">
                <POSProductGrid 
                  searchTerm={searchTerm} 
                  categoryId={selectedCategoryId}
                  viewMode={viewMode}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Cart Panel */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <POSOrderDetails />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
};

export default POS;
