import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import CategoryIcons from './components/CategoryIcons';
import WhatsNew from './components/WhatsNew';
import Recents from './components/Recents';
import Login from './components/Login';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

function AppContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <Navbar
        onToggleSidebar={toggleSidebar}
        onToggleDarkMode={toggleDarkMode}
        darkMode={darkMode}
        user={user}
      />
      <div className="main-content">
        <Sidebar isOpen={sidebarOpen} />
        <main className={`content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <Hero />
          <CategoryIcons />
          <WhatsNew />
          <Recents />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;