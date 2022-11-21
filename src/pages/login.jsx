import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// Components
import AppLayout from '@/components/layouts/AppLayout';

// Hooks
import useAuth from '@/hooks/useAuth';

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const [status, setStatus] = useState(null);

    const auth = useAuth({ middleware: 'guest', redirectIfAuthenticated: '/' });
    
    const qrCodeInputEl = useRef(null);

    useEffect(() => {
        document.addEventListener('keypress', handleKeyUpEvent);

        return () => document.removeEventListener('keypress', handleKeyUpEvent);
    });

    const handleKeyUpEvent = (e) => {
        if (e.keyCode !== 13) {
            qrCodeInputEl.current.value += e.key;
        } else {
            submit();
        }
    }

    const handleSubmitEvent = (e) => {
        e.preventDefault();
        
        submit();
    }

    const submit = () => {
        const inputValue = qrCodeInputEl.current.value;

        (async() => {
            setIsLoading(true);

            return await auth.login({ setErrors, setStatus, idcard: inputValue });
        })()
            .finally(
                () => setIsLoading(false)
            );


        qrCodeInputEl.current.value = '';
    }
  
    return (
        <AppLayout isLoading={ isLoading } title="Login">
            <div className="fixed inset-0 flex items-center justify-center">
                <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg text-black shadow-md shadow-deep-orange-500">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-center space-x-3">
                            <Image
                                src="logo.png"
                                alt="Logo PT Mah Sing Indonesia"
                                width={50}
                                height={50}
                            />
                            <span className="font-bold uppercase">
                                PT Mah Sing Indonesia
                            </span>
                        </div>

                        <hr className="h-[2px] bg-gray-400 rounded-sm" />

                        <div className="flex items-center justify-center">
                            <span className="text-sm">
                                Silahkan Login Dengan QR Code Login
                            </span>
                        </div>
                        
                        <form onSubmit={ (e) => handleSubmitEvent(e) } hidden>
                            <input
                                type="text"
                                ref={ qrCodeInputEl }
                                className="bg-transparent text-black focus:outline-none"
                                required={ true }
                            />
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
