import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import ReportForm from './ReportPage/ReportForm';
import EventList from './components/EventList';
import { Tab, Tabs } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { AuthProvider, useAuth } from './components/AuthContext';
import LoginPage from './components/LoginForm';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
    const { user, checkAuth } = useAuth();
    const [isChecking, setIsChecking] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const verifyAuth = async () => {
            await checkAuth(); // Обновляем статус аутентификации
            setIsChecking(false);
        };

        verifyAuth();
    }, []);

    useEffect(() => {
        if (!isChecking && !user) {
            navigate('/login');
        }
    }, [user, isChecking, navigate]);

    if (isChecking) {
        return <div className="d-flex justify-content-center mt-5">
            <div className="spinner-border" role="status">
                <span className="visually-hidden">Загрузка...</span>
            </div>
        </div>;
    }

    return user ? children : null;
};

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={
                    <ProtectedRoute>
                        <div className="container py-5">
                            <header className="text-center mb-5">
                                <h1 className="display-4">Система учета конкурсных достижений</h1>
                                <p className="lead">Форма отчетности по участию в конкурсах</p>
                            </header>

                            <main>
                                <Tabs defaultActiveKey="form" id="app-tabs" className="mb-4">
                                    <Tab eventKey="form" title="Создать отчет">
                                        <ReportForm />
                                    </Tab>
                                    <Tab eventKey="history" title="История мероприятий">
                                        <EventList />
                                    </Tab>
                                </Tabs>
                            </main>

                            <footer className="mt-5 text-center text-muted">
                                <p>© {new Date().getFullYear()} Учебное заведение</p>
                            </footer>
                        </div>
                    </ProtectedRoute>
                } />
            </Routes>
        </AuthProvider>
    );
}

export default App;