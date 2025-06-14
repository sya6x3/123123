import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get(
                    'http://localhost:5000/api/check-auth',
                    { withCredentials: true }
                );
                if (response.data.authenticated) {
                    setUser({ name: response.data.user.username });
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            }
        };
        checkAuth();
    }, []);
    const [user, setUser] = useState(null);

    const login = async (username, password) => {
        const response = await axios.post('/api/login', { username, password });
        if (response.data.success) {
            setUser({ username });
        }
    };

    const logout = async () => {
        await axios.post('/api/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => React.useContext(AuthContext);