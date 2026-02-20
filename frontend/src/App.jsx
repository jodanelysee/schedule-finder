import { useState } from 'react'
import { Outlet } from 'react-router'
import './App.css'
import Navbar from './components/Navbar'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Remove max-w-7xl to allow full width */}
      <main className="pt-20 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
