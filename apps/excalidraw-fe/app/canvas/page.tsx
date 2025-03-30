"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { useAuth } from '@/components/AuthContext';
import { Navbar } from '@/components/Navbar';

export default function CanvasRedirect() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Generate a random room ID
      const roomId = nanoid(10);
      
      // Redirect to the new room
      router.push(`/canvas/${roomId}`);
    }
  }, [router, isAuthenticated, isLoading]);
  
  return (
    <div className="w-screen h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Creating New Whiteboard...</h1>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 