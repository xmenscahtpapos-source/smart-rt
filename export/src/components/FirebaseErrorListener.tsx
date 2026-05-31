
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // In development, we want this to show up in the Next.js error overlay
      // but we also use a toast for visibility.
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: error.message,
      });
      
      if (process.env.NODE_ENV === 'development') {
        // Throwing here will trigger the Next.js error overlay
        // which is helpful for debugging security rules contextual errors.
        console.error(error);
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
