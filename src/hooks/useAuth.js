import axios from "axios";
import useSWR from "swr";
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function useAuth({ middleware, redirectIfAuthenticated } = {}) {
    const router = useRouter();

    const { data, error, mutate } = useSWR(
        `${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/auth/get`,
        async (...args) => axios
            .get(args)
            .then(res => res.data !== '' ? res.data : false)
            .catch(error => error)
    );

    const login = async ({ setErrors, setStatus, ...props }) => {
        setErrors([]);
        setStatus(null);

        return await axios
            .post(`${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/auth/login`, props)
            .then(() => mutate());
    }

    const logout = async () => {
        if (! error) {
            await axios
                .post(`${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/auth/logout`)
                .then(() => mutate());
        }

        router.push({
            pathname: '/login',
            query: { returnUrl: router.asPath }
        });
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