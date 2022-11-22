import axios from "axios";
import useSWR from "swr";
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function useAuth({ middleware, redirectIfAuthenticated } = {}) {
    const router = useRouter();

    const { data, error, mutate } = useSWR(
        `http://msi-ps.test/api/auth/get`,
        async (...args) => axios
            .get(args)
            .then(res => res.data !== '' ? res.data : false)
            .catch(error => error)
    );

    const login = async ({ setErrors, setStatus, ...props }) => {
        setErrors([]);
        setStatus(null);

        return await axios
            .post(`http://msi-ps.test/api/auth/login`, props)
            .then(() => mutate());
    }

    const logout = async () => {
        if (! error) {
            await axios
                .post(`http://msi-ps.test/api/auth/logout`)
                .then(() => mutate());
        }

        router.replace('/login');
    }

    useEffect(() => {
        if (middleware === 'guest' && redirectIfAuthenticated && data && data.constructor.name !== 'AxiosError') router.push(redirectIfAuthenticated);
        if (middleware === 'auth' && ((!data && (typeof data !== 'undefined')) || error)) logout();
    }, [data, error]);

    return {
        data,
        error,
        mutate,
        login,
        logout
    };
}