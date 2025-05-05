// src/hooks/usePagination.tsx
import { useState } from 'react';

const usePagination = (totalItems, itemsPerPage) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const currentItems = (items) => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  };

  return { currentPage, totalPages, setCurrentPage, currentItems };
};

export default usePagination;