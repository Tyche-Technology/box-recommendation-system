import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import RecommendPage from './pages/RecommendPage';
import BoxCatalogPage from './pages/BoxCatalogPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RecommendPage />} />
        <Route path="/catalog" element={<BoxCatalogPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
