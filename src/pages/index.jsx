import { useState } from 'react';
import Image from 'next/image';

// Components
import AppLayout from '@/components/layouts/AppLayout';

// Hooks
import useAuth from '@/hooks/useAuth';

export default function Index() {
  const { data: auth } = useAuth({ middleware: 'auth' });

  const [isLoading, setIsLoading] = useState(false);

  return (
    <AppLayout
      isLoading={ isLoading }>
      <div className="h-12 w-full bg-gradient-to-b from-blue-400 via-blue-800 to-blue-400 px-4 py-1 flex items-center justify-between">
        <div className="w-1/4">
          {/* <img src="dist/logo.png" alt="Logo" class="inline-flex items-center h-8"> */}
          <div className="inline-flex items-center h-8">
            <Image
              src="logo.png"
              alt="Logo PT Mah Sing Indonesia"
              width={50}
              height={50}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
