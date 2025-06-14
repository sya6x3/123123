import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import MultiSelect from './MultiSelect';
import PhotoUpload from './PhotoUpload';
import axios from 'axios';

const ReportForm = () => {
  const API_BASE_URL = "http://localhost:5000";
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [eventLevels, setEventLevels] = useState([]);
  const [resultLevels, setResultLevels] = useState([]);
  const [departments, setDepartments] = useState([]); // ДОБАВЛЕНО
  const [studentGroups, setStudentGroups] = useState([]); // ДОБАВЛЕНО
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [eventLevel, setEventLevel] = useState('');
  const [resultLevel, setResultLevel] = useState('');
  const [photo, setPhoto] = useState(null);
  const [fullName, setFullName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');


  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Загрузка данных с сервера...');
        const urls = [
          `${API_BASE_URL}/api/teachers`,
          `${API_BASE_URL}/api/students`,
          `${API_BASE_URL}/api/event-levels`,
          `${API_BASE_URL}/api/result-levels`,
          `${API_BASE_URL}/api/departments`,    // Добавлено
          `${API_BASE_URL}/api/student-groups` 
        ];

        const responses = await Promise.all(urls.map(url => axios.get(url)));
        console.log('Получены ответы:', responses);
        setTeachers(responses[0].data);
        setStudents(responses[1].data);
        setEventLevels(responses[2].data);
        setResultLevels(responses[3].data);
        setDepartments(responses[4].data);     // Загрузка кафедр
        setStudentGroups(responses[5].data);   // Загрузка групп
      } catch (err) {
        console.error('Детали ошибки:', {
          message: err.message,
          response: err.response,
          config: err.config
        });
        setError('Ошибка загрузки данных: ' + err.message, err.response, err.config);
      }
    };
    
    fetchData();
  }, [API_BASE_URL]); // Пустой массив зависимостей = выполнить только при монтировании



  


  

  const handleSubmit = async (e) => {
    e.preventDefault();

  const formData = new FormData();
  formData.append('full_name', fullName);
  formData.append('event_date', eventDate);
  formData.append('location', location);
  formData.append('event_level_id', eventLevel);
  formData.append('result_level_id', resultLevel);
  
  // Send comma-separated IDs instead of objects
  formData.append('teachers', selectedTeachers.join(','));
  formData.append('students', selectedStudents.join(','));
  
  if (photo) {
    formData.append('photo', photo);
  }
    
    try {
      await axios.post(`${API_BASE_URL}/api/events`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSubmitted(true);
      // Сброс формы
      setFullName('');
      setEventDate('');
      setLocation('');
      setSelectedTeachers([]);
      setSelectedStudents([]);
      setEventLevel('');
      setResultLevel('');
      setPhoto(null);
    } catch (err) {
      setError('–ě—ą–ł–Ī–ļ–į –Ņ—Ä–ł —Ā–ĺ—Ö—Ä–į–Ĺ–Ķ–Ĺ–ł–ł –ĺ—ā—á–Ķ—ā–į');
      console.error(err);
    }
  };

  return (
    <div className="p-4 border rounded-3 bg-light">
      <h2 className="mb-4">Создание отчета о конкурсе</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {submitted && (
        <Alert variant="success" onClose={() => setSubmitted(false)} dismissible>
          Отчет успешно сохранен!
        </Alert>
      )}
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Полное наименование мероприятия</Form.Label>
          <Form.Control 
            type="text" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            required 
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Дата проведения</Form.Label>
          <Form.Control 
            type="date" 
            value={eventDate} 
            onChange={(e) => setEventDate(e.target.value)} 
            required 
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Место проведения</Form.Label>
          <Form.Control 
            type="text" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            required 
          />
        </Form.Group>
        
        <MultiSelect 
          label="Преподаватели"
          options={teachers.map(t => ({ 
            id: t.id, 
            name: t.full_name, 
            category: t.department_id 
          }))}
          selected={selectedTeachers}
          onChange={setSelectedTeachers}
          categories={departments}
          categoryLabel="кафедры"
          placeholder="Поиск преподавателя..."
        />
        
        <MultiSelect 
        label="Студенты"
        options={students.map(s => ({ 
          id: s.id, 
          name: s.full_name, 
          category: s.group_id 
        }))}
        selected={selectedStudents}
        onChange={setSelectedStudents}
        categories={studentGroups}
        categoryLabel="группы"
        placeholder="Поиск студента..."
        />
        
        <Form.Group className="mb-3">
          <Form.Label>Уровень мероприятия</Form.Label>
          <Form.Select 
            value={eventLevel} 
            onChange={(e) => setEventLevel(e.target.value)}
            required
          >
            <option value="">Выберите уровень</option>
            {eventLevels.map(level => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Результат</Form.Label>
          <Form.Select 
            value={resultLevel} 
            onChange={(e) => setResultLevel(e.target.value)}
            required
          >
            <option value="">Выберите результат</option>
            {resultLevels.map(result => (
              <option key={result.id} value={result.id}>
                {result.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        
        <PhotoUpload onPhotoChange={setPhoto} />
        
        <Button variant="primary" type="submit" className="mt-3">
          Сохранить отчет
        </Button>
      </Form>
    </div>
  );
};

export default ReportForm;