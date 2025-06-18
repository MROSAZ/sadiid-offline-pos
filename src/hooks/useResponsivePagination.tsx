// src/hooks/useResponsivePagination.tsx
import { useState, useEffect, useMemo } from 'react';
import usePagination from './usePagination';

interface UseResponsivePaginationProps<T> {
  items: T[];
  viewMode: 'grid' | 'table';
  initialPage?: number;
}

interface UseResponsivePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  currentItems: T[];
  itemsPerPage: number;
  handlePageChange: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
}

/**
 * Custom hook that handles responsive pagination based on screen size and view mode
 */
function useResponsivePagination<T>({
  items,
  viewMode,
  initialPage = 1
}: UseResponsivePaginationProps<T>): UseResponsivePaginationReturn<T> {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  // Update screen size on resize
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate items per page based on screen size and view mode
  const itemsPerPage = useMemo(() => {
    if (viewMode === 'table') {
      // For table view, calculate based on available height
      // Assuming header ~200px, pagination ~60px, table header ~40px, row height ~50px
      const availableHeight = screenSize.height - 300;
      const rowHeight = 50;
      const maxRows = Math.floor(availableHeight / rowHeight);
      return Math.max(5, Math.min(maxRows, 20)); // Min 5, max 20 rows
    } else {
      // For grid view, calculate based on screen dimensions
      const { width } = screenSize;
      
      // Calculate columns based on screen width
      let columns: number;
      if (width < 640) {
        columns = 2; // sm: 2 columns
      } else if (width < 768) {
        columns = 3; // md: 3 columns
      } else if (width < 1024) {
        columns = 4; // lg: 4 columns
      } else if (width < 1280) {
        columns = 5; // xl: 5 columns
      } else {
        columns = 6; // 2xl: 6 columns
      }
      
      // Calculate rows based on available height
      // Assuming header ~200px, pagination ~60px, card height ~160px, gap ~16px
      const availableHeight = screenSize.height - 260;
      const cardHeight = 160;
      const gap = 16;
      const effectiveCardHeight = cardHeight + gap;
      const maxRows = Math.floor(availableHeight / effectiveCardHeight);
      
      // Ensure at least 2 rows, max 6 rows
      const rows = Math.max(2, Math.min(maxRows, 6));
      
      return columns * rows;
    }
  }, [screenSize, viewMode]);

  // Use the regular pagination hook with calculated items per page
  const paginationResult = usePagination({
    items,
    itemsPerPage,
    initialPage
  });

  return {
    ...paginationResult,
    itemsPerPage
  };
}

export default useResponsivePagination;
