import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, Menu } from 'lucide-react';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <div className="app-container">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="main-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header className="topbar" style={{ 
          height: '70px', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 2rem',
          backgroundColor: 'var(--surface-color)'
        }}>
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(true)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Menu size={24} />
            </button>
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--background-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', width: '300px' }}>
              <Search size={18} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
              <input 
                type="text" 
                placeholder="Search courses, students..." 
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    alert('Searching for: ' + e.target.value);
                  }
                }}
              />
            </div>
          </div>
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => alert('Opening notifications panel...')} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
              <Bell size={20} color="var(--text-main)" />
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: 'var(--danger)', color: 'white', fontSize: '10px', width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
            </button>
          </div>
        </header>
        
        <main className="main-content" style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--background-color)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
