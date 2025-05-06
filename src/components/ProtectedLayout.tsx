import React from 'react';
import { Outlet } from 'react-router-dom';
import Layout from './Layout';

/**
 * ProtectedLayout wraps authenticated routes with layout
 */
const ProtectedLayout: React.FC = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedLayout;