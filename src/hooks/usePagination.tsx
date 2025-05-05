// src/hooks/usePagination.tsx
import { useState } from 'react';

const usePagination = (items: any[], itemsPerPage: number) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const currentItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return {
    currentPage,
    totalPages,
    currentItems, // Ensure this is an array
    setCurrentPage,
  };
};

export default usePagination;