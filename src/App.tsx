import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LicenseGuard from './components/LicenseGuard';

// Pages
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import Orders from './pages/Orders';
import Finance from './pages/Finance';
import Expenses from './pages/Expenses';
import Workers from './pages/Workers';
import Materials from './pages/Materials';
import Settings from './pages/Settings';
import AppMenu from './pages/AppMenu';
import LicenseActivation from './pages/LicenseActivation';
import QRCodePage from './renderer/pages/QRCodePage';

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* License Activation - No Guard */}
          <Route path="/license" element={<LicenseActivation />} />
          
          {/* QR Code Window - Full Screen */}
          <Route path="/qr-code" element={<QRCodePage />} />
          
          {/* Protected Routes - Require License */}
          <Route path="/menu" element={
            <LicenseGuard>
              <AppMenu />
            </LicenseGuard>
          } />
          
          {/* Main Pages with Layout - Protected */}
          <Route path="/" element={
            <LicenseGuard>
              <Layout><Dashboard /></Layout>
            </LicenseGuard>
          } />
          <Route path="/doctors" element={
            <LicenseGuard>
              <Layout><Doctors /></Layout>
            </LicenseGuard>
          } />
          <Route path="/orders" element={
            <LicenseGuard>
              <Layout><Orders /></Layout>
            </LicenseGuard>
          } />
          <Route path="/finance" element={
            <LicenseGuard>
              <Layout><Finance /></Layout>
            </LicenseGuard>
          } />
          <Route path="/expenses" element={
            <LicenseGuard>
              <Layout><Expenses /></Layout>
            </LicenseGuard>
          } />
          <Route path="/workers" element={
            <LicenseGuard>
              <Layout><Workers /></Layout>
            </LicenseGuard>
          } />
          <Route path="/materials" element={
            <LicenseGuard>
              <Layout><Materials /></Layout>
            </LicenseGuard>
          } />
          <Route path="/settings" element={
            <LicenseGuard>
              <Layout><Settings /></Layout>
            </LicenseGuard>
          } />
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/license" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}