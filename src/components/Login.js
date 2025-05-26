// src/components/Login.js
import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useUser } from '../context/UserContext'; 
import { useNavigate, Navigate } from 'react-router-dom';

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, login } = useUser(); 
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    switch (user.user_type) {
      case 'patient': return <Navigate to="/patient" replace />;
      case 'doctor': return <Navigate to="/doctor" replace />;
      case 'pharmacist': return <Navigate to="/pharmacist" replace />;
      case 'nurse': return <Navigate to="/nurse" replace />;
      case 'lab_technician': return <Navigate to="/labtech" replace />; 
      case 'administrator': return <Navigate to="/admin" replace />; 
      default: return <Navigate to="/" replace />; 
    }
  }

  const handleSubmit = async (values) => {
    const { username, password } = values;
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/identity/login/', {
        username,
        password,
      });

      if (response.status === 200) {
        const userData = response.data;
        console.log('Login successful:', userData);
        login(userData);

        switch (userData.user_type) {
          case 'patient': navigate('/patient'); break;
          case 'doctor': navigate('/doctor'); break;
          case 'pharmacist': navigate('/pharmacist'); break;
          case 'nurse': navigate('/nurse'); break;
          case 'lab_technician': navigate('/labtech'); break;
          case 'administrator': navigate('/admin'); break;
          default: navigate('/');
        }
      } else {
        setError('Unexpected login response.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      if (error.response) {
        if (error.response.status === 401) {
          setError('Invalid username or password.');
        } else {
          setError(`Login failed: ${error.response.status} ${error.response.statusText}`);
        }
      } else if (error.request) {
        setError('Login failed: Could not connect to the authentication service.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-light-gray px-4">
      <Card className="w-full max-w-md shadow-md">
        <div className="text-center mb-8">
          <Title level={2} className="text-primary-dark">Healthcare Management System</Title>
          <p className="text-dark-gray">Sign in to access your dashboard</p>
        </div>
        
        {error && (
          <Alert
            message="Login Error"
            description={error}
            type="error"
            showIcon
            className="mb-6"
          />
        )}
        
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your Username!' }]}
          >
            <Input prefix={<UserOutlined className="text-dark-gray" />} placeholder="Username" />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-dark-gray" />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full" 
              loading={loading}
            >
              Log in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;