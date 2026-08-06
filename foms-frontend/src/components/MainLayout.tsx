import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalHeader from './GlobalHeader';


export const MainLayout: React.FC = () => {
  return (
    <div className="app-layout" style={{ alignItems: 'stretch' }}>
      <Sidebar />
      <div className="main-area" style={{ justifyContent: 'flex-start', height: '100vh', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
        <GlobalHeader />
        <main className="content-area" style={{ flex: 1, padding: '28px', background: '#EEF2FF', display: 'flex', flexDirection: 'column', minWidth: 0, boxSizing: 'border-box', width: '100%', maxWidth: '100%' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
