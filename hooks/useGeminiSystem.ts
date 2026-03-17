import { useState, useEffect } from 'react';
import { testConnection } from '../services/geminiService';

export const useGeminiSystem = () => {
    const [isApiConnected, setIsApiConnected] = useState<boolean | null>(null);
    const [isTestingApi, setIsTestingApi] = useState(false);

    useEffect(() => {
        checkApiConnection();
    }, []);

    const checkApiConnection = async () => {
        const connected = await testConnection();
        setIsApiConnected(connected);
    };

    const handleTestApi = async () => {
        setIsTestingApi(true);
        const connected = await testConnection();
        setIsApiConnected(connected);
        setIsTestingApi(false);
    };

    return {
        isApiConnected,
        isTestingApi,
        checkApiConnection,
        handleTestApi,
    };
};
