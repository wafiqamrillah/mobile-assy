import { useState } from 'react';
import Link from 'next/link';

// Components
import AppLayout from '@/components/layouts/AppLayout';
import Navbar from '@/components/layouts/Navbar';

export default function Index() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AppLayout
      isLoading={ isLoading }>
        <Navbar />
        
        <div className="pt-16 flex-auto flex flex-col items-center justify-center space-y-2">
          {
            ([
              {href : '/adjust_qty', label: 'Adjust Qty'},
              {href : '/input_pull_list', label: 'Input Pull List'},
            ]).map((item, index) => {
              return (
                <Link key={ `button#${index}` } href={ item.href } className="w-full">
                  <button
                    className="p-6 w-full bg-gradient-to-b from-blue-400 to-blue-800 hover:from-blue-100 hover:to-blue-400 border focus:from-blue-900 focus:to-blue-600 border-gray-500 rounded-lg focus:outline-none">
                    { item.label }
                  </button>
                </Link>
              );
            })
          }
        </div>
    </AppLayout>
  )
}
