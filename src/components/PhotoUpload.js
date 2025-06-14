import React, { useState } from 'react';
import { Form, Image } from 'react-bootstrap';
import { FiUpload } from 'react-icons/fi';

const PhotoUpload = ({ onPhotoChange }) => {
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onPhotoChange(file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>Фотография</Form.Label>
      <div className="d-flex align-items-center">
        <div className="border rounded p-2 me-3" style={{ width: '100px', height: '100px' }}>
          {preview ? (
            <Image src={preview} alt="Preview" fluid />
          ) : (
            <div className="d-flex justify-content-center align-items-center h-100 text-muted">
              <FiUpload size={24} />
            </div>
          )}
        </div>
        <Form.Control type="file" accept="image/*" onChange={handleChange} />
      </div>
    </Form.Group>
  );
};

export default PhotoUpload;