import React, { useState } from 'react';
import { Form, ListGroup, Badge } from 'react-bootstrap';

const MultiSelect = ({ 
  label, 
  options, 
  selected, 
  onChange, 
  categories, 
  categoryLabel,
  placeholder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Фильтрация опций
  const filteredOptions = options.filter(option => {
    const matchesCategory = !selectedCategory || 
      String(option.category) === String(selectedCategory);
      //console.log(option.category + "anddd" + selectedCategory)
    const matchesSearch = !searchTerm || 
      option.name.toLowerCase().includes(searchTerm.toLowerCase());
      const isNotSelected = !selected.includes(option.id);
      return matchesCategory && matchesSearch && isNotSelected;
  });

  // Обработчик добавления элемента
  const handleAdd = (id) => {
    if (!selected.includes(id)) {
      onChange([...selected, id]);
    }
    setSearchTerm('');
  };

  // Обработчик удаления элемента
  const handleRemove = (id) => {
    onChange(selected.filter(item => item !== id));
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      
      {/* Фильтр по категории */}
      <Form.Select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="mb-2"
      >
        <option value="">Все {categoryLabel}</option>
        {categories.map(category => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Form.Select>

      {/* Поле поиска */}
      <Form.Control
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Результаты поиска */}
      {searchTerm && filteredOptions.length > 0 && (
        <ListGroup className="mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {filteredOptions.map(option => (
            <ListGroup.Item 
              key={option.id} 
              action 
              onClick={() => handleAdd(option.id)}
              className="d-flex justify-content-between align-items-center"
            >
              {option.name}
              <Badge bg="primary">Добавить</Badge>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {/* Выбранные элементы */}
      <div className="mt-3">
        {options
          .filter(option => selected.includes(option.id))
          .map(option => (
            <Badge 
              key={option.id} 
              bg="secondary" 
              className="me-1 mb-1 d-inline-flex align-items-center"
            >
              {option.name}
              <button 
                type="button" 
                className="btn-close btn-close-white ms-2" 
                aria-label="Close"
                onClick={() => handleRemove(option.id)}
                style={{ fontSize: '0.5rem' }}
              />
            </Badge>
          ))}
      </div>
    </Form.Group>
  );
};

export default MultiSelect;