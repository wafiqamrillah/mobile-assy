import { useRouter } from 'next/router';
import Head from 'next/head';
import LoadingScreen from '@/components/layouts/LoadingScreen';

export default function AppLayout({ header = undefined, title = undefined, isLoading = false, children }) {
    const router = useRouter();
    return (
        <div className="relative min-h-screen bg-indigo-900 text-white m-0">
            <Head>
                <title>ANDON Mobile{ title ? ` | ${title}` : '' }</title>
                <meta name="description" content="PT Mah Sing Indonesia assembly modules" />
                <link rel="icon" href={ `${router.basePath}/favicon.png` } />
            </Head>

            {/* Page Heading */}
            {
                header ? (
                    <header>
                        <div className="py-2">
                            {header}
                        </div>
                    </header>
                ) : null
            }

            {/* Page Content */}
            <main className="relative min-h-screen flex flex-col space-y-3">
                {children}
            </main>

            <LoadingScreen isLoading={isLoading}/>
        </div>
    );
}