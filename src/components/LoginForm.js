import React, { useState } from 'react';
import axios from 'axios';

export default function LoginForm({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/login', { username, password });
            localStorage.setItem('token', res.data.token);
            onLogin();
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
        <form onSubmit={handleSubmit}>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="�����" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="������" />
            <button type="submit">�����</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </form>
    );
}
