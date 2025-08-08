import React, { useState } from 'react';

const FulfilmentStaffReg = () => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    role: '',
    warehouse: ''
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('Registration successful!');
  };

  return (
    <div>
      <h2>Fulfilment Staff Registration</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Contact Details:</label>
          <input type="text" name="contact" value={formData.contact} onChange={handleChange} required />
        </div>
        <div>
          <label>Role:</label>
          <input type="text" name="role" value={formData.role} onChange={handleChange} required />
        </div>
        <div>
          <label>Warehouse:</label>
          <select name="warehouse" value={formData.warehouse} onChange={handleChange} required>
            <option value="">Select a warehouse</option>
            <option value="Warehouse 1">Warehouse 1</option>
            <option value="Warehouse 2">Warehouse 2</option>
            <option value="Warehouse 3">Warehouse 3</option>
          </select>
        </div>
        <button type="submit">Submit</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
};

export default FulfilmentStaffReg;