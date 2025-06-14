import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const API_BASE_URL = "http://localhost:5000";

    // Функция для проверки аутентификации
    const checkAuth = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/check-auth`, {
                withCredentials: true
            });

            if (response.data.authenticated) {
                setUser(response.data.user);
            } else {
                setUser(null);
            }
            return response.data.authenticated;
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            setUser(null);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Проверяем аутентификацию при загрузке приложения
    useEffect(() => {
        checkAuth();
    }, []);

    // Функция для входа
    const login = async (username, password) => {
        try {
            await axios.post(
                `${API_BASE_URL}/api/login`,
                { username, password },
                { withCredentials: true }
            );
            return await checkAuth(); // Проверяем статус после входа
        } catch (error) {
            console.error('Ошибка входа:', error);
            return false;
        }
    };

    // Функция для выхода
    const logout = async () => {
        try {
            await axios.post(`${API_BASE_URL}/api/logout`, {}, {
                withCredentials: true
            });
            setUser(null);
            return true;
        } catch (error) {
            console.error('Ошибка выхода:', error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            logout,
            checkAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);