import React, { useState, useEffect } from 'react';
import {
  Layout, Typography, Card, Button, Form, Input, 
  Alert, Space, List, Tag, Modal, Divider,
  Row, Col, Spin, message
} from 'antd';
import {
  UserOutlined, CalendarOutlined, FileTextOutlined,
  MedicineBoxOutlined, ExperimentOutlined, EyeOutlined
} from '@ant-design/icons';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

// Service URLs
const SERVICE_URLS = {
  doctor: 'http://localhost:8002/api',
  appointments: 'http://localhost:8004/api',
  medicalRecords: 'http://localhost:8007/api',
  prescription: 'http://localhost:8008/api',
  lab: 'http://localhost:8006/api',
};

const DoctorDashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // State for fetched data
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isLabOrderModalOpen, setIsLabOrderModalOpen] = useState(false);
  
  // Forms
  const [reportForm] = Form.useForm();
  const [prescriptionForm] = Form.useForm();
  const [labOrderForm] = Form.useForm();
  
  // Loading states for actions
  const [reportLoading, setReportLoading] = useState(false);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [labOrderLoading, setLabOrderLoading] = useState(false);
  
  // Current patient info for forms
  const [currentPatient, setCurrentPatient] = useState(null);

  // Data Fetching
  useEffect(() => {
    const fetchDoctorData = async () => {
      setLoading(true);
      setError(null);

      const doctorUserId = user.id;

      try {
        // 1. Fetch Doctor Profile
        const profileResponse = await axios.get(`${SERVICE_URLS.doctor}/doctors/${doctorUserId}/`);
        setDoctorProfile(profileResponse.data);

        // 2. Fetch Doctor's Appointments
        const appointmentsResponse = await axios.get(`${SERVICE_URLS.appointments}/appointments/`, {
          params: { doctor_user_id: doctorUserId }
        });
        const sortedAppointments = appointmentsResponse.data.sort((a, b) =>
          new Date(a.start_time) - new Date(b.start_time)
        );
        setAppointments(sortedAppointments);
      } catch (err) {
        console.error('Error fetching doctor data:', err);
        if (err.response && err.response.data && err.response.data.error) {
          setError(`Failed to fetch doctor data: ${err.response.data.error}`);
        } else if (err.request) {
          setError('Failed to fetch doctor data: Network error or service is down.');
        } else {
          setError('An unexpected error occurred while fetching data.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id && user.user_type === 'doctor') {
      fetchDoctorData();
    } else {
      setLoading(false);
    }
  }, [user, navigate]);

  // Handle View Patient History
  const handleViewPatientHistory = (patientUserId) => {
    navigate(`/patients/${patientUserId}/medical-history`);
  };

  // Handle Start Report Writing
  const handleStartWriteReport = (appointment) => {
    const patient = appointment.patient;
    setCurrentPatient({
      id: appointment.patient_user_id,
      name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'
    });
    setIsReportModalOpen(true);
    reportForm.resetFields();
  };

  // Handle Submit Report
  const handleSubmitReport = async (values) => {
    setReportLoading(true);

    const reportPayload = {
      patient_user_id: currentPatient.id,
      doctor_user_id: user.id,
      title: values.title,
      content: values.content,
      report_date: new Date().toISOString(),
    };

    try {
      const response = await axios.post(`${SERVICE_URLS.medicalRecords}/reports/`, reportPayload);

      if (response.status === 201) {
        message.success('Medical report saved successfully!');
        setIsReportModalOpen(false);
        reportForm.resetFields();
      }
    } catch (err) {
      console.error('Saving report failed:', err);
      if (err.response && err.response.data && err.response.data.error) {
        message.error(`Failed to save report: ${err.response.data.error}`);
      } else {
        message.error('Failed to save report. Please try again.');
      }
    } finally {
      setReportLoading(false);
    }
  };

  // Handle Start Prescribing
  const handleStartPrescribing = (appointment) => {
    const patient = appointment.patient;
    setCurrentPatient({
      id: appointment.patient_user_id,
      name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'
    });
    setIsPrescriptionModalOpen(true);
    prescriptionForm.resetFields();
  };

  // Handle Submit Prescription
  const handleSubmitPrescription = async (values) => {
    setPrescriptionLoading(true);

    const prescriptionPayload = {
      patient_user_id: currentPatient.id,
      doctor_user_id: user.id,
      medication_name: values.medication_name,
      dosage: values.dosage,
      frequency: values.frequency,
      duration: values.duration,
      notes: values.notes || null,
      prescription_date: new Date().toISOString(),
    };

    try {
      const response = await axios.post(`${SERVICE_URLS.prescription}/prescriptions/`, prescriptionPayload);

      if (response.status === 201) {
        message.success('Prescription saved successfully!');
        setIsPrescriptionModalOpen(false);
        prescriptionForm.resetFields();
      }
    } catch (err) {
      console.error('Saving prescription failed:', err);
      if (err.response && err.response.data && err.response.data.error) {
        message.error(`Failed to save prescription: ${err.response.data.error}`);
      } else {
        message.error('Failed to save prescription. Please try again.');
      }
    } finally {
      setPrescriptionLoading(false);
    }
  };

  // Handle Start Lab Order
  const handleStartOrderLabTest = (appointment) => {
    const patient = appointment.patient;
    setCurrentPatient({
      id: appointment.patient_user_id,
      name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'
    });
    setIsLabOrderModalOpen(true);
    labOrderForm.resetFields();
  };

  // Handle Submit Lab Order
  const handleSubmitOrderLabTest = async (values) => {
    setLabOrderLoading(true);

    const orderPayload = {
      patient_user_id: currentPatient.id,
      doctor_user_id: user.id,
      test_type: values.test_type,
      notes: values.notes || null,
      order_date: new Date().toISOString(),
    };

    try {
      const response = await axios.post(`${SERVICE_URLS.lab}/orders/`, orderPayload);

      if (response.status === 201) {
        message.success('Lab order created successfully!');
        setIsLabOrderModalOpen(false);
        labOrderForm.resetFields();
      }
    } catch (err) {
      console.error('Ordering lab test failed:', err);
      if (err.response && err.response.data && err.response.data.error) {
        message.error(`Failed to create lab order: ${err.response.data.error}`);
      } else {
        message.error('Failed to create lab order. Please try again.');
      }
    } finally {
      setLabOrderLoading(false);
    }
  };

  // Early return for redirection
  if (!user || user.user_type !== 'doctor') {
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

  // Get status color for appointments
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'blue';
    }
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="bg-blue-600 flex items-center justify-between px-6">
        <Title level={3} className="text-white m-0">
          Healthcare Management System - Doctor
        </Title>
        <Button danger onClick={logout}>Logout</Button>
      </Header>

      <Content className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Doctor Profile Card */}
          {doctorProfile && (
            <Card title={<><UserOutlined className="mr-2" />Your Profile</>}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Text strong>Name: </Text>
                  <Text>{doctorProfile.first_name} {doctorProfile.last_name}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Username: </Text>
                  <Text>{doctorProfile.username}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Email: </Text>
                  <Text>{doctorProfile.email}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Specialization: </Text>
                  <Text>{doctorProfile.specialization || 'N/A'}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>License Number: </Text>
                  <Text>{doctorProfile.license_number || 'N/A'}</Text>
                </Col>
              </Row>
              {doctorProfile._identity_error && (
                <Alert
                  message="Warning"
                  description={`Could not load all identity data: ${doctorProfile._identity_error}`}
                  type="warning"
                  showIcon
                  className="mt-4"
                />
              )}
            </Card>
          )}

          {/* Appointments Card */}
          <Card title={<><CalendarOutlined className="mr-2" />Your Appointments</>}>
            {appointments.length > 0 ? (
              <List
                dataSource={appointments}
                renderItem={appointment => (
                  <List.Item>
                    <Card className="w-full shadow-sm border-l-4" 
                          style={{ borderLeftColor: getStatusColor(appointment.status) === 'blue' ? '#3498db' : getStatusColor(appointment.status) === 'green' ? '#2ecc71' : '#e74c3c' }}>
                      <div className="flex flex-col lg:flex-row lg:justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-blue-600">
                            {new Date(appointment.start_time).toLocaleString()} - {new Date(appointment.end_time).toLocaleString()}
                          </div>
                          <div className="mt-2">
                            <Text strong>Patient: </Text>
                            <Text>
                              {appointment.patient ? 
                                `${appointment.patient.first_name} ${appointment.patient.last_name}` : 
                                (appointment._patient_identity_error || 'N/A')}
                            </Text>
                          </div>
                          <div className="mt-2">
                            <Tag color={getStatusColor(appointment.status)}>
                              {appointment.status.toUpperCase()}
                            </Tag>
                          </div>
                        </div>
                        
                        {appointment.patient_user_id && (
                          <div className="mt-4 lg:mt-0 lg:ml-4">
                            <Space direction="vertical" size="small">
                              <Button 
                                icon={<EyeOutlined />}
                                onClick={() => handleViewPatientHistory(appointment.patient_user_id)}
                                size="small"
                              >
                                View History
                              </Button>
                              <Button 
                                icon={<FileTextOutlined />}
                                onClick={() => handleStartWriteReport(appointment)}
                                size="small"
                                type="default"
                              >
                                Write Report
                              </Button>
                              <Button 
                                icon={<MedicineBoxOutlined />}
                                onClick={() => handleStartPrescribing(appointment)}
                                size="small"
                                type="default"
                              >
                                Prescribe
                              </Button>
                              <Button 
                                icon={<ExperimentOutlined />}
                                onClick={() => handleStartOrderLabTest(appointment)}
                                size="small"
                                type="default"
                              >
                                Order Lab Test
                              </Button>
                            </Space>
                          </div>
                        )}
                      </div>
                      
                      {/* Display errors if present */}
                      {appointment._patient_identity_error && (
                        <Alert
                          message="Warning"
                          description={`Patient identity missing: ${appointment._patient_identity_error}`}
                          type="warning"
                          showIcon
                          className="mt-2"
                          size="small"
                        />
                      )}
                      {appointment._doctor_identity_error && (
                        <Alert
                          message="Warning"
                          description={`Doctor identity missing: ${appointment._doctor_identity_error}`}
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
                <Text type="secondary">No appointments found.</Text>
              </div>
            )}
          </Card>
        </div>
      </Content>

      {/* Write Report Modal */}
      <Modal
        title={`Write Medical Report for ${currentPatient?.name || 'Patient'}`}
        open={isReportModalOpen}
        onCancel={() => setIsReportModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={reportForm}
          layout="vertical"
          onFinish={handleSubmitReport}
        >
          <Form.Item 
            name="title" 
            label="Report Title" 
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Enter report title" />
          </Form.Item>
          
          <Form.Item 
            name="content" 
            label="Report Content" 
            rules={[{ required: true, message: 'Please enter report content' }]}
          >
            <TextArea rows={6} placeholder="Enter detailed report content" />
          </Form.Item>
          
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsReportModalOpen(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={reportLoading}>
                Save Report
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Prescription Modal */}
      <Modal
        title={`Prescribe Medication for ${currentPatient?.name || 'Patient'}`}
        open={isPrescriptionModalOpen}
        onCancel={() => setIsPrescriptionModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={prescriptionForm}
          layout="vertical"
          onFinish={handleSubmitPrescription}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="medication_name" 
                label="Medication Name" 
                rules={[{ required: true, message: 'Please enter medication name' }]}
              >
                <Input placeholder="e.g., Aspirin" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="dosage" 
                label="Dosage" 
                rules={[{ required: true, message: 'Please enter dosage' }]}
              >
                <Input placeholder="e.g., 100mg" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="frequency" 
                label="Frequency" 
                rules={[{ required: true, message: 'Please enter frequency' }]}
              >
                <Input placeholder="e.g., Once daily" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="duration" 
                label="Duration" 
                rules={[{ required: true, message: 'Please enter duration' }]}
              >
                <Input placeholder="e.g., 7 days" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="notes" label="Notes (Optional)">
            <TextArea rows={3} placeholder="Additional instructions or notes" />
          </Form.Item>
          
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsPrescriptionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={prescriptionLoading}>
                Save Prescription
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Lab Order Modal */}
      <Modal
        title={`Order Lab Test for ${currentPatient?.name || 'Patient'}`}
        open={isLabOrderModalOpen}
        onCancel={() => setIsLabOrderModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form
          form={labOrderForm}
          layout="vertical"
          onFinish={handleSubmitOrderLabTest}
        >
          <Form.Item 
            name="test_type" 
            label="Test Type" 
            rules={[{ required: true, message: 'Please enter test type' }]}
          >
            <Input placeholder="e.g., Complete Blood Count, Urinalysis" />
          </Form.Item>
          
          <Form.Item name="notes" label="Notes (Optional)">
            <TextArea rows={3} placeholder="Doctor notes for the lab" />
          </Form.Item>
          
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsLabOrderModalOpen(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={labOrderLoading}>
                Create Order
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default DoctorDashboard;