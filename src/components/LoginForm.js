import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';

export default function LoginForm({ onLogin }) {
    const API_BASE_URL = "http://localhost:5000";
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async e => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await axios.post(
                `${API_BASE_URL}/api/login`,
                { username, password },
                { withCredentials: true }
            );

            onLogin();
            navigate('/'); // ��������� ���������������
        } catch (err) {
            if (err.response) {
                setError(err.response.data.error || 'ашипака');
            } else if (err.request) {
                setError('������ �� ��������');
            } else {
                setError('������ ��� �������� �������');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">���� � �������</h2>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">�����</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="Логин"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">������</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Пароль"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="spinner"></span>
                        ) : 'Войти'}
                    </button>

                    {error && <div className="error-message">{error}</div>}
                </form>
            </div>
        </div>
    );
}