"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';

export default function CanvasRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Generate a random room ID
    const roomId = nanoid(10);
    
    // Redirect to the new room
    router.push(`/canvas/${roomId}`);
  }, [router]);
  
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Creating New Whiteboard...</h1>
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
} 