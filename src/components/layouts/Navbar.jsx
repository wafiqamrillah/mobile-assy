import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Hooks
import useAuth from '@/hooks/useAuth';
import { faAngleLeft, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

export default function Navbar (){
    const router = useRouter();
    const { data: auth, logout } = useAuth({ middleware: 'auth' });
    const [currentLocation, setCurrentLocation] = useState('');

    const handleLogoutButton = () => logout();

    useEffect(() => {
        setCurrentLocation(window.location.pathname);
    }, [currentLocation]);

    return (
        <nav className="fixed top-0 w-full z-30">
            <div className="h-12 px-4 py-1 bg-gradient-to-b from-blue-400 to-blue-700 shadow-lg grid grid-cols-3 content-center place-items-center">
                <div className="justify-self-start">
                    {
                        currentLocation !== '/' ? (
                            <Link href="/">
                                <button
                                    type="button"
                                    className="px-4 py-2 hover:bg-gradient-to-b focus:bg-gradient-to-b hover:from-blue-100 focus:from-blue-800 hover:to-blue-600 focus:to-blue-400 border border-transparent hover:border-gray-100 focus:border-gray-700 hover:cursor-pointer focus:outline-none rounded-xl">
                                    <FontAwesomeIcon icon={faAngleLeft} size="xl"/>
                                </button>
                            </Link>
                        ) : null
                    }
                </div>
                <div className="justify-self-center">
                    <Image
                        src={ `${router.basePath}/logo.png` }
                        alt="Logo PT Mah Sing Indonesia"
                        width={50}
                        height={50}
                    />
                </div>
                <div className="justify-self-end">
                    <button
                        type="button"
                        onClick={ () => handleLogoutButton() }
                        className="px-4 py-2 hover:bg-gradient-to-b focus:bg-gradient-to-b hover:from-blue-100 focus:from-blue-800 hover:to-blue-600 focus:to-blue-400 border border-transparent hover:border-gray-100 focus:border-gray-700 hover:cursor-pointer focus:outline-none rounded-xl">
                        <FontAwesomeIcon icon={faRightFromBracket} size="xl"/>
                    </button>
                </div>
            </div>
            <div className="m-1 px-2 py-1 bg-blue-300 border border-gray-500 shadow-lg text-black text-sm font-bold rounded-xl flex items-center justify-between">
                <div>
                    User: { auth?.nama ?? '' }
                </div>
                <div>
                    NIK: { auth?.nik ?? '' }
                </div>
            </div>
        </nav>
    );
}