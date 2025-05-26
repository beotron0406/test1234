// src/components/PatientDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  Layout, Typography, Card, Button, Tag, List, 
  Divider, Space, Skeleton, Modal, Form, 
  Select, DatePicker, TimePicker, message, Alert, Empty 
} from 'antd';
import { 
  UserOutlined, CalendarOutlined, HistoryOutlined, 
  PlusOutlined, MessageOutlined 
} from '@ant-design/icons';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// Service URLs
const SERVICE_URLS = {
  patient: 'http://localhost:8001/api',
  doctor: 'http://localhost:8002/api',
  appointments: 'http://localhost:8004/api',
  medicalRecords: 'http://localhost:8007/api',
};

const PatientDashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // State variables
  const [patientProfile, setPatientProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [bookingForm] = Form.useForm();
  const [bookingLoading, setBookingLoading] = useState(false);

  // Data fetching
  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);
      setError(null);

      const patientUserId = user.id;

      try {
        // 1. Fetch Patient Profile
        const profileResponse = await axios.get(`${SERVICE_URLS.patient}/patients/${patientUserId}/`);
        setPatientProfile(profileResponse.data);

        // 2. Fetch Patient Appointments
        const appointmentsResponse = await axios.get(`${SERVICE_URLS.appointments}/appointments/`, {
          params: { patient_user_id: patientUserId }
        });
        setAppointments(appointmentsResponse.data);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        if (err.response && err.response.data && err.response.data.error) {
          setError(`Failed to fetch patient data: ${err.response.data.error}`);
        } else if (err.request) {
          setError('Failed to fetch patient data: Network error or service is down.');
        } else {
          setError('An unexpected error occurred while fetching data.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id && user.user_type === 'patient') {
      fetchPatientData();
    } else {
      setLoading(false);
    }
  }, [user, navigate]);

  // Doctor fetching
  useEffect(() => {
    if (isBookingModalOpen && doctors.length === 0) {
      const fetchDoctors = async () => {
        try {
          const doctorsResponse = await axios.get(`${SERVICE_URLS.doctor}/doctors/`);
          setDoctors(doctorsResponse.data);
        } catch (err) {
          console.error('Error fetching doctors:', err);
          message.error('Failed to load doctors list.');
        }
      };
      fetchDoctors();
    }
  }, [isBookingModalOpen, doctors.length]);

  // Booking handler
  const handleBookAppointment = async (values) => {
    setBookingLoading(true);
    
    const patientUserId = user.id;
    const { doctorId, appointmentDate, appointmentTime } = values;
    
    // Combine date and time
    const startDateTime = new Date(
      appointmentDate.year(), 
      appointmentDate.month(), 
      appointmentDate.date(),
      appointmentTime.hour(),
      appointmentTime.minute()
    );
    
    // End time is 2 hours after start time
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

    const bookingPayload = {
      patient_user_id: patientUserId,
      doctor_user_id: doctorId,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
    };

    try {
      const response = await axios.post(`${SERVICE_URLS.appointments}/appointments/`, bookingPayload);

      if (response.status === 201) {
        message.success('Appointment booked successfully!');
        
        // Refetch appointments list
        const appointmentsResponse = await axios.get(`${SERVICE_URLS.appointments}/appointments/`, {
          params: { patient_user_id: patientUserId }
        });
        setAppointments(appointmentsResponse.data);
        
        setIsBookingModalOpen(false);
        bookingForm.resetFields();
      } else {
        message.error('Failed to book appointment: Unexpected response.');
      }
    } catch (err) {
      console.error('Booking failed:', err);
      if (err.response) {
        if (err.response.status === 409) {
          message.error(`Booking failed: ${err.response.data.error || 'Doctor not available.'}`);
        } else if (err.response.data && err.response.data.error) {
          message.error(`Booking failed: ${err.response.data.error}`);
        } else {
          message.error(`Booking failed: ${err.response.status} ${err.response.statusText}`);
        }
      } else if (err.request) {
        message.error('Booking failed: Network error or service is down.');
      } else {
        message.error('An unexpected error occurred during booking.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // Render loading skeleton
  if (loading) {
    return (
      <Layout className="min-h-screen bg-light-gray">
        <Content className="p-6">
          <Card className="max-w-6xl mx-auto shadow">
            <Skeleton active avatar paragraph={{ rows: 4 }} />
            <Divider />
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </Content>
      </Layout>
    );
  }

  // Render error state
  if (error) {
    return (
      <Layout className="min-h-screen bg-light-gray">
        <Content className="p-6">
          <Card className="max-w-6xl mx-auto shadow">
            <Title level={2}>Error</Title>
            <Text type="danger">{error}</Text>
            <div className="mt-4">
              <Button danger onClick={logout}>Logout</Button>
            </div>
          </Card>
        </Content>
      </Layout>
    );
  }

  // Render dashboard
  return (
    <Layout className="min-h-screen bg-light-gray">
      <Header className="bg-primary flex items-center justify-between px-6">
        <div className="text-white text-lg font-semibold">Healthcare Management System</div>
        <Button danger onClick={logout}>Logout</Button>
      </Header>
      
      <Content className="p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="mb-6 shadow-md">
            <Title level={2} className="mb-4 pb-2 border-b border-gray-200">
              <UserOutlined className="mr-2" />
              Patient Dashboard
            </Title>
            
            {/* Profile Section */}
            {patientProfile && (
              <Card title="Your Profile" className="mb-6" bordered={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Name:</strong> {patientProfile.first_name} {patientProfile.last_name}</p>
                    <p><strong>Username:</strong> {patientProfile.username}</p>
                    <p><strong>Email:</strong> {patientProfile.email}</p>
                  </div>
                  <div>
                    <p><strong>Date of Birth:</strong> {patientProfile.date_of_birth || 'N/A'}</p>
                    <p><strong>Address:</strong> {patientProfile.address || 'N/A'}</p>
                    <p><strong>Phone:</strong> {patientProfile.phone_number || 'N/A'}</p>
                  </div>
                </div>
                {patientProfile._identity_error && (
                  <Alert
                    message="Warning" 
                    description={`Could not load all identity data: ${patientProfile._identity_error}`}
                    type="warning"
                    showIcon
                    className="mt-4"
                  />
                )}
              </Card>
            )}
            
            {/* Appointments Section */}
            <Card title="Your Appointments" className="mb-6" bordered={false}
                  extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsBookingModalOpen(true)}>Book Appointment</Button>}>
              {appointments.length > 0 ? (
                <List
                  dataSource={appointments}
                  renderItem={appointment => {
                    // Determine status color
                    let statusColor = 'blue';
                    if (appointment.status === 'completed') statusColor = 'green';
                    if (appointment.status === 'cancelled') statusColor = 'red';
                    
                    return (
                      <List.Item>
                        <Card className="w-full shadow-sm border-l-4" style={{ borderLeftColor: statusColor === 'blue' ? '#3498db' : statusColor === 'green' ? '#2ecc71' : '#e74c3c' }}>
                          <div className="flex flex-col md:flex-row md:justify-between">
                            <div>
                              <p className="font-bold text-primary-dark">
                                {new Date(appointment.start_time).toLocaleString()} - {new Date(appointment.end_time).toLocaleString()}
                              </p>
                              <p className="mt-2">
                                <strong>Doctor:</strong> {appointment.doctor ? 
                                  `${appointment.doctor.first_name} ${appointment.doctor.last_name} (${appointment.doctor.specialization || appointment.doctor.user_type})` : 
                                  (appointment._doctor_identity_error || 'N/A')}
                              </p>
                              <div className="mt-2">
                                <Tag color={statusColor}>{appointment.status.toUpperCase()}</Tag>
                              </div>
                            </div>
                          </div>
                          
                          {/* Display errors if present */}
                          {appointment._patient_identity_error && (
                            <p className="text-warning text-sm mt-2">Warning: Patient identity missing for this appt: {appointment._patient_identity_error}</p>
                          )}
                          {appointment._doctor_identity_error && (
                            <p className="text-warning text-sm mt-1">Warning: Doctor identity missing for this appt: {appointment._doctor_identity_error}</p>
                          )}
                        </Card>
                      </List.Item>
                    );
                  }}
                />
              ) : (
                <Empty description="No appointments found" />
              )}
            </Card>
            
            {/* Medical History Link */}
            <Card title="Medical History" className="mb-6" bordered={false}>
              <Button 
                type="primary" 
                icon={<HistoryOutlined />} 
                onClick={() => navigate(`/patient/medical-history`)}
                className="w-full md:w-auto"
              >
                View Detailed Medical History
              </Button>
            </Card>
          </Card>
        </div>
      </Content>
      
      {/* Fixed Chat Button */}
      <Button 
        type="primary" 
        shape="circle" 
        icon={<MessageOutlined />} 
        size="large"
        className="fixed bottom-8 right-8 shadow-lg"
        onClick={() => window.location.href = "http://127.0.0.1:5000"}
      />
      
      {/* Booking Modal */}
      <Modal
        title="Book New Appointment"
        open={isBookingModalOpen}
        onCancel={() => setIsBookingModalOpen(false)}
        footer={null}
      >
        <Form
          form={bookingForm}
          layout="vertical"
          onFinish={handleBookAppointment}
        >
          <Form.Item
            name="doctorId"
            label="Select Doctor"
            rules={[{ required: true, message: 'Please select a doctor' }]}
          >
            <Select placeholder="Select a doctor" loading={doctors.length === 0}>
              {doctors.map(doctor => (
                <Option key={doctor.user_id} value={doctor.user_id}>
                  {doctor.first_name} {doctor.last_name} ({doctor.specialization || 'N/A'})
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="appointmentDate"
            label="Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker className="w-full" disabledDate={date => date.isBefore(dayjs().startOf('day'))} />
          </Form.Item>
          
          <Form.Item
            name="appointmentTime"
            label="Time"
            rules={[{ required: true, message: 'Please select a time' }]}
          >
            <TimePicker className="w-full" format="HH:mm" minuteStep={15} />
          </Form.Item>
          
          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setIsBookingModalOpen(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={bookingLoading}>
                Book Appointment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default PatientDashboard;