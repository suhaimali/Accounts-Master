import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900 && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileOpen]);

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="main-content">
        <Topbar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
