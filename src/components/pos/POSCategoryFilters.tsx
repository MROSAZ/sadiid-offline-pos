import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { getCategories } from '@/lib/storage';
import { toast } from 'sonner';

interface POSCategoryFiltersProps {
  onCategoryChange: (categoryId: number | null) => void;
  selectedCategoryId: number | null;
}

interface Category {
  id: number;
  name: string;
}

const POSCategoryFilters: React.FC<POSCategoryFiltersProps> = ({ 
  onCategoryChange,
  selectedCategoryId
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Failed to load product categories');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Handle selecting a category
  const handleCategorySelect = (categoryId: number | null) => {
    onCategoryChange(categoryId);
  };

  if (loading) {
    return (
      <div className="py-3 mb-4">
        <div className="flex space-x-2 overflow-x-auto">
          {[1, 2, 3, 4, 5].map(i => (
            <div 
              key={i} 
              className="h-8 w-24 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
      {/* All Products Button */}
      <Button
        variant={selectedCategoryId === null ? 'default' : 'outline'}
        className={
          selectedCategoryId === null
            ? 'bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap'
            : 'bg-white text-gray-700 whitespace-nowrap'
        }
        onClick={() => onCategoryChange(null)}
      >
        All Products
      </Button>
      
      {/* Category Buttons */}
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={category.id === selectedCategoryId ? 'default' : 'outline'}
          className={
            category.id === selectedCategoryId
              ? 'bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap'
              : 'bg-white text-gray-700 whitespace-nowrap'
          }
          onClick={() => onCategoryChange(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
      );
    };

export default POSCategoryFilters;
