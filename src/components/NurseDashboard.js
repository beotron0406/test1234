// src/components/NurseDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Layout, Typography, Card, Button, Form, Input, 
  Alert, Space, List, Select, Modal, Divider,
  Row, Col, Spin, message, InputNumber, DatePicker
} from 'antd';
import {
  UserOutlined, HeartOutlined, PlusOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Service URLs
const SERVICE_URLS = {
  nurse: 'http://localhost:8005/api',
  patient: 'http://localhost:8001/api',
};

const NurseDashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // State for fetched data
  const [nurseProfile, setNurseProfile] = useState(null);
  const [recordedVitals, setRecordedVitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal and form states
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [vitalsForm] = Form.useForm();
  const [vitalsLoading, setVitalsLoading] = useState(false);

  // Data Fetching
  useEffect(() => {
    const fetchNurseData = async () => {
      setLoading(true);
      setError(null);

      const nurseUserId = user.id;

      try {
        // 1. Fetch Nurse Profile
        const profileResponse = await axios.get(`${SERVICE_URLS.nurse}/nurses/${nurseUserId}/`);
        setNurseProfile(profileResponse.data);

        // 2. Fetch Vitals Recorded by This Nurse
        const vitalsResponse = await axios.get(`${SERVICE_URLS.nurse}/vitals/`, {
          params: { nurse_user_id: nurseUserId }
        });
        setRecordedVitals(vitalsResponse.data);
      } catch (err) {
        console.error('Error fetching nurse data:', err);
        if (err.response && err.response.data && err.response.data.error) {
          setError(`Failed to fetch nurse data: ${err.response.data.error}`);
        } else if (err.request) {
          setError('Failed to fetch nurse data: Network error or service is down.');
        } else {
          setError('An unexpected error occurred while fetching data.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id && user.user_type === 'nurse') {
      fetchNurseData();
    } else {
      setLoading(false);
    }
  }, [user, navigate]);

  // Fetch Patients when modal opens
  useEffect(() => {
    if (isVitalsModalOpen && patients.length === 0) {
      const fetchPatients = async () => {
        try {
          const patientsResponse = await axios.get(`${SERVICE_URLS.patient}/patients/`);
          setPatients(patientsResponse.data);
        } catch (err) {
          console.error('Error fetching patients:', err);
          message.error('Failed to load patients list.');
        }
      };
      fetchPatients();
    }
  }, [isVitalsModalOpen, patients.length]);

  // Handle Submit Vitals
  const handleSubmitVitals = async (values) => {
    setVitalsLoading(true);

    const nurseUserId = user.id;
    
    // Prepare timestamp
    let timestampToSend = values.timestamp.toISOString();

    const vitalsPayload = {
      patient_user_id: values.patient_user_id,
      nurse_user_id: nurseUserId,
      timestamp: timestampToSend,
      temperature_celsius: values.temperature_celsius || null,
      blood_pressure_systolic: values.blood_pressure_systolic || null,
      blood_pressure_diastolic: values.blood_pressure_diastolic || null,
      heart_rate_bpm: values.heart_rate_bpm || null,
      respiratory_rate_bpm: values.respiratory_rate_bpm || null,
      oxygen_saturation_percentage: values.oxygen_saturation_percentage || null,
      notes: values.notes || null,
    };

    try {
      const response = await axios.post(`${SERVICE_URLS.nurse}/vitals/`, vitalsPayload);

      if (response.status === 201) {
        message.success('Vitals recorded successfully!');
        
        // Refetch recorded vitals list
        const vitalsResponse = await axios.get(`${SERVICE_URLS.nurse}/vitals/`, {
          params: { nurse_user_id: nurseUserId }
        });
        setRecordedVitals(vitalsResponse.data);
        
        setIsVitalsModalOpen(false);
        vitalsForm.resetFields();
      }
    } catch (err) {
      console.error('Recording vitals failed:', err);
      if (err.response && err.response.data && err.response.data.error) {
        message.error(`Failed to record vitals: ${err.response.data.error}`);
      } else {
        message.error('Failed to record vitals. Please try again.');
      }
    } finally {
      setVitalsLoading(false);
    }
  };

  // Early return for redirection
  if (!user || user.user_type !== 'nurse') {
    navigate('/login');
    return <div>Redirecting...</div>;
  }

  // Render loading state
  if (loading) {
    return (
      <Layout className="min-h-screen">
        <Content className="flex items-center justify-center">
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  // Render error state
  if (error) {
    return (
      <Layout className="min-h-screen">
        <Content className="p-6">
          <Card className="max-w-4xl mx-auto">
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              action={<Button danger onClick={logout}>Logout</Button>}
            />
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="bg-green-600 flex items-center justify-between px-6">
        <Title level={3} className="text-white m-0">
          Healthcare Management System - Nurse
        </Title>
        <Button danger onClick={logout}>Logout</Button>
      </Header>

      <Content className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Nurse Profile Card */}
          {nurseProfile && (
            <Card title={<><UserOutlined className="mr-2" />Your Profile</>}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Text strong>Name: </Text>
                  <Text>{nurseProfile.first_name} {nurseProfile.last_name}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Username: </Text>
                  <Text>{nurseProfile.username}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Employee ID: </Text>
                  <Text>{nurseProfile.employee_id || 'N/A'}</Text>
                </Col>
              </Row>
              {nurseProfile._identity_error && (
                <Alert
                  message="Warning"
                  description={`Could not load all identity data: ${nurseProfile._identity_error}`}
                  type="warning"
                  showIcon
                  className="mt-4"
                />
              )}
            </Card>
          )}

          {/* Record Vitals Card */}
          <Card 
            title={<><HeartOutlined className="mr-2" />Record Patient Vitals</>}
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsVitalsModalOpen(true)}
              >
                Record New Vitals
              </Button>
            }
          >
            {recordedVitals.length > 0 ? (
              <List
                dataSource={recordedVitals}
                renderItem={vital => (
                  <List.Item>
                    <Card className="w-full shadow-sm border-l-4 border-l-green-500">
                      <div className="flex flex-col lg:flex-row lg:justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-green-600 mb-2">
                            <ClockCircleOutlined className="mr-2" />
                            {new Date(vital.timestamp).toLocaleString()}
                          </div>
                          <div className="mb-2">
                            <Text strong>Patient: </Text>
                            <Text>
                              {vital.patient ? 
                                `${vital.patient.first_name} ${vital.patient.last_name}` : 
                                (vital._patient_identity_error || 'N/A')}
                            </Text>
                          </div>
                          
                          {/* Vitals Details Grid */}
                          <Row gutter={[16, 8]} className="mt-3">
                            {vital.temperature_celsius !== null && (
                              <Col span={12}>
                                <Text type="secondary">Temperature: </Text>
                                <Text strong>{vital.temperature_celsius}°C</Text>
                              </Col>
                            )}
                            {(vital.blood_pressure_systolic !== null || vital.blood_pressure_diastolic !== null) && (
                              <Col span={12}>
                                <Text type="secondary">Blood Pressure: </Text>
                                <Text strong>{vital.blood_pressure_systolic || '?'}/{vital.blood_pressure_diastolic || '?'} mmHg</Text>
                              </Col>
                            )}
                            {vital.heart_rate_bpm !== null && (
                              <Col span={12}>
                                <Text type="secondary">Heart Rate: </Text>
                                <Text strong>{vital.heart_rate_bpm} bpm</Text>
                              </Col>
                            )}
                            {vital.respiratory_rate_bpm !== null && (
                              <Col span={12}>
                                <Text type="secondary">Respiratory Rate: </Text>
                                <Text strong>{vital.respiratory_rate_bpm} bpm</Text>
                              </Col>
                            )}
                            {vital.oxygen_saturation_percentage !== null && (
                              <Col span={12}>
                                <Text type="secondary">O₂ Saturation: </Text>
                                <Text strong>{vital.oxygen_saturation_percentage}%</Text>
                              </Col>
                            )}
                          </Row>
                          
                          {vital.notes && (
                            <div className="mt-3 p-2 bg-gray-50 rounded">
                              <Text type="secondary">Notes: </Text>
                              <Text italic>{vital.notes}</Text>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Display errors if present */}
                      {vital._patient_identity_error && (
                        <Alert
                          message="Warning"
                          description={`Patient identity missing: ${vital._patient_identity_error}`}
                          type="warning"
                          showIcon
                          className="mt-2"
                          size="small"
                        />
                      )}
                      {vital._nurse_identity_error && (
                        <Alert
                          message="Warning"
                          description={`Nurse identity missing: ${vital._nurse_identity_error}`}
                          type="warning"
                          showIcon
                          className="mt-2"
                          size="small"
                        />
                      )}
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center py-8">
                <Text type="secondary">No vitals recorded yet.</Text>
              </div>
            )}
          </Card>
        </div>
      </Content>

      {/* Record Vitals Modal */}
      <Modal
        title="Record Patient Vitals"
        open={isVitalsModalOpen}
        onCancel={() => {
          setIsVitalsModalOpen(false);
          vitalsForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={vitalsForm}
          layout="vertical"
          onFinish={handleSubmitVitals}
          initialValues={{
            timestamp: dayjs()
          }}
        >
          <Form.Item 
            name="patient_user_id" 
            label="Select Patient" 
            rules={[{ required: true, message: 'Please select a patient' }]}
          >
            <Select placeholder="Select a patient" loading={patients.length === 0}>
              {patients.map(patient => (
                <Option key={patient.user_id} value={patient.user_id}>
                  {patient.first_name} {patient.last_name} ({patient.username})
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="timestamp" 
            label="Timestamp" 
            rules={[{ required: true, message: 'Please select timestamp' }]}
          >
            <DatePicker 
              showTime 
              className="w-full" 
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Form.Item>
          
          <Divider>Vital Signs</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="temperature_celsius" label="Temperature (°C)">
                <InputNumber 
                  placeholder="36.5" 
                  step={0.1} 
                  min={30} 
                  max={45} 
                  className="w-full" 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="heart_rate_bpm" label="Heart Rate (bpm)">
                <InputNumber 
                  placeholder="75" 
                  min={30} 
                  max={200} 
                  className="w-full" 
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="blood_pressure_systolic" label="Systolic BP (mmHg)">
                <InputNumber 
                  placeholder="120" 
                  min={50} 
                  max={250} 
                  className="w-full" 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="blood_pressure_diastolic" label="Diastolic BP (mmHg)">
                <InputNumber 
                  placeholder="80" 
                  min={30} 
                  max={150} 
                  className="w-full" 
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="respiratory_rate_bpm" label="Respiratory Rate (bpm)">
                <InputNumber 
                  placeholder="18" 
                  min={5} 
                  max={50} 
                  className="w-full" 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="oxygen_saturation_percentage" label="O₂ Saturation (%)">
                <InputNumber 
                  placeholder="98" 
                  step={0.1} 
                  min={70} 
                  max={100} 
                  className="w-full" 
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Additional notes or observations" />
          </Form.Item>
          
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsVitalsModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={vitalsLoading}
                disabled={patients.length === 0}
              >
                Save Vitals
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default NurseDashboard;