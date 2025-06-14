import React, { useState, useEffect } from 'react';
import { Table, Image, Container, Badge, Form, Button } from 'react-bootstrap';
import axios from 'axios';

const EventList = () => {
    const API_BASE_URL = "http://localhost:5000";
    const [events, setEvents] = useState([]);
    const [eventLevels, setEventLevels] = useState([]);
    const [resultLevels, setResultLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        eventLevel: '',
        resultLevel: ''
    });
    // For credentials (cookies/sessions)
    axios.defaults.withCredentials = true;

    const fetchEvents = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.eventLevel) params.append('eventLevel', filters.eventLevel);
            if (filters.resultLevel) params.append('resultLevel', filters.resultLevel);

            const response = await axios.get(`${ API_BASE_URL } / api / events ? ${ params.toString() }`);
            setEvents(response.data);
        } catch (err) {
            setError('Ошибка загрузки данных');
            console.error(err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventsRes, levelsRes, resultsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/events`),
                    axios.get(`${API_BASE_URL}/api/event-levels`),
                    axios.get(`${API_BASE_URL}/api/result-levels`)
                ]);
                setEvents(eventsRes.data);
                setEventLevels(levelsRes.data);
                setResultLevels(resultsRes.data);
                setLoading(false);
            } catch (err) {
                setError('Ошибка загрузки данных');
                setLoading(false);
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const handleExport = (format) => {
        const params = new URLSearchParams({
            format,
            ...filters
        });
        window.open(`${ API_BASE_URL } / api / events /export?${ params.toString() }, '_blank'`);
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p className="text-danger">{error}</p>;

    return (
        <Container className="mt-5">
            <h2 className="mb-4">История мероприятий</h2>
            <Form className="mb-3">
                <Form.Group>
                    <Form.Label>Дата от</Form.Label>
                    <Form.Control type="date" value={filters.startDate}
                        onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Дата до</Form.Label>
                    <Form.Control type="date" value={filters.endDate}
                        onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Уровень</Form.Label>
                    <Form.Select value={filters.eventLevel}
                        onChange={e => setFilters({ ...filters, eventLevel: e.target.value })}>
                        <option value="">Все</option>
                        {eventLevels.map(level => (
                            <option key={level.id} value={level.id}>{level.name}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Результат</Form.Label>
                    <Form.Select value={filters.resultLevel}
                        onChange={e => setFilters({ ...filters, resultLevel: e.target.value })}>
                        <option value="">Все</option>
                        {resultLevels.map(result => (
                            <option key={result.id} value={result.id}>{result.name}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <Button className="mt-2" onClick={fetchEvents}>Фильтровать</Button>
                <Button className="mt-2 ms-2" onClick={() => handleExport('excel')}>Экспорт в Excel</Button>
                <Button className="mt-2 ms-2" onClick={() => handleExport('pdf')}>Экспорт в PDF</Button>
            </Form>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Название</th>
                        <th>Дата</th>
                        <th>Место</th>
                        <th>Уровень</th>
                        <th>Результат</th>
                        <th>Преподаватели</th>
                        <th>Студенты</th>
                        <th>Фото</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event, index) => (
                        <tr key={event.id}>
                            <td>{index + 1}</td>
                            <td>{event.full_name}</td>
                            <td>{new Date(event.event_date).toLocaleDateString()}</td>
                            <td>{event.location}</td>
                            <td>{event.event_level}</td>
                            <td>{event.result_level}</td>
                            <td>
                                {event.teachers && event.teachers.split(',')
                                    .map(teacher => (
                                        <Badge key={teacher} bg="info" className="me-1">
                                            {teacher}
                                        </Badge>
                                    ))}
                            </td>
                            <td>
                                {event.students && event.students.split(',')
                                    .map(student => (
                                        <Badge key={student} bg="success" className="me-1">
                                            {student}
                                        </Badge>
                                    ))}
                            </td>
                            <td>
                                {event.photo_path && (
                                    <Image
                                        src={`${API_BASE_URL}${event.photo_path}`} // Исправлено здесь
                                        alt="Фото мероприятия"
                                        thumbnail
                                        style={{ maxWidth: '100px' }}
                                    />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
};

export default EventList;
