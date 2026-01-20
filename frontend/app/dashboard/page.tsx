'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Define the check inside the effect
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
      } else {
        setUser(localStorage.getItem('username') || 'User');
        setIsLoading(false);
      }
    };

    // 2. Run it immediately
    checkAuth();
    
    // 3. Include router in dependency array to satisfy the linter
  }, [router]); 

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/login');
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Welcome, {user}!</h1>
      <p className="text-xl mb-8">You have successfully logged in.</p>
      <button 
        onClick={handleLogout}
        className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200"
      >
        Logout
      </button>
    </div>
  );
}