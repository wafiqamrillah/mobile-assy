import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Hooks
import useAuth from '@/hooks/useAuth';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

export default function Navbar (){
    const { data: auth } = useAuth({ middleware: 'auth' });

    return (
        <nav className="fixed top-0 w-full">
            <div className="h-12 px-4 py-1 bg-gradient-to-b from-blue-400 to-blue-700 shadow-lg flex items-center justify-between">
                <div>
                    <Image
                        src="logo.png"
                        alt="Logo PT Mah Sing Indonesia"
                        width={50}
                        height={50}
                    />
                </div>
                <div>
                <FontAwesomeIcon icon={faRightFromBracket} size="xl"/>
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