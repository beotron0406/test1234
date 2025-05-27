// src/components/ChatbotComponent.js
import React, { useState, useEffect, useRef } from 'react';
import {
    Card, Input, Button, Avatar, Typography, Spin, message,
    Space, Tooltip
} from 'antd';
import {
    SendOutlined, RobotOutlined, UserOutlined,
    SoundOutlined, CloseOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

const ChatbotComponent = ({
    isOpen,
    onClose,
    style = {},
    className = "",
    chatbotApiUrl = "http://127.0.0.1:8000/api/chatbot" }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);

    // TTS functionality
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [currentSpeech, setCurrentSpeech] = useState(null);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Initialize chatbot
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage = {
                id: Date.now(),
                text: `🤖 Xin chào! Tôi là chatbot y tế thông minh. Tôi có thể giúp bạn:
        
• Tìm hiểu về các bệnh và triệu chứng
• Cung cấp thông tin về cách phòng ngừa  
• Tư vấn về vắc-xin và điều trị

⚠️ Lưu ý: Thông tin chỉ mang tính tham khảo. Vui lòng tham khảo ý kiến bác sĩ cho chẩn đoán chính xác.`,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        }
    }, [isOpen, messages.length]);

    // Scroll to bottom when new message is added
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || loading) return;

        const userMessage = {
            id: Date.now(),
            text: inputMessage,
            sender: 'user',
            timestamp: new Date()
        };

        // Add user message immediately
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setLoading(true);
        setIsTyping(true);

        try {
            const response = await axios.post(`${chatbotApiUrl}/message/`, {
                message: inputMessage,
                session_id: sessionId
            });

            const botMessage = {
                id: Date.now() + 1,
                text: response.data.response,
                sender: 'bot',
                timestamp: new Date()
            };

            // Update session ID if returned
            if (response.data.session_id) {
                setSessionId(response.data.session_id);
            }

            // Add bot message with typing delay
            setTimeout(() => {
                setMessages(prev => [...prev, botMessage]);
                setIsTyping(false);

                // Auto-speak if TTS is enabled
                if (ttsEnabled) {
                    speakText(botMessage.text);
                }
            }, 1000);

        } catch (error) {
            console.error('Chatbot error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                text: 'Xin lỗi, đã xảy ra lỗi khi xử lý tin nhắn của bạn. Vui lòng thử lại.',
                sender: 'bot',
                timestamp: new Date(),
                isError: true
            };

            setTimeout(() => {
                setMessages(prev => [...prev, errorMessage]);
                setIsTyping(false);
            }, 1000);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // TTS Functions
    const toggleTTS = () => {
        setTtsEnabled(!ttsEnabled);
        if (currentSpeech) {
            stopSpeaking();
        }
        message.info(ttsEnabled ? 'Đã tắt đọc tin nhắn' : 'Đã bật đọc tin nhắn');
    };

    const speakText = (text) => {
        if (!('speechSynthesis' in window)) return;

        stopSpeaking();

        const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text));
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
            setCurrentSpeech(null);
        };

        setCurrentSpeech(utterance);
        speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        setCurrentSpeech(null);
    };

    const cleanTextForSpeech = (text) => {
        return text
            .replace(/🤖|⚠️|✅|❌|📊|🏥|💊|🩺|•/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const formatMessage = (text) => {
        // Simple markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>')
            .replace(/•/g, '•');
    };

    if (!isOpen) return null;

    return (
        <Card
            className={`chatbot-container ${className}`}
            style={{
                width: 400,
                height: 600,
                position: 'fixed',
                bottom: 20,
                right: 20,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                ...style
            }}
            bodyStyle={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
            }}
        >
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                color: 'white',
                padding: '16px',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Space>
                    <RobotOutlined style={{ fontSize: '20px' }} />
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                        Healthcare AI Assistant
                    </Text>
                </Space>
                <Space>
                    <Tooltip title={ttsEnabled ? 'Tắt đọc tin nhắn' : 'Bật đọc tin nhắn'}>
                        <Button
                            type="text"
                            icon={<SoundOutlined />}
                            onClick={toggleTTS}
                            style={{
                                color: 'white',
                                background: ttsEnabled ? 'rgba(255,255,255,0.2)' : 'transparent'
                            }}
                        />
                    </Tooltip>
                    <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={onClose}
                        style={{ color: 'white' }}
                    />
                </Space>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                background: '#f8f9fa',
                maxHeight: '450px'
            }}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            display: 'flex',
                            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: '12px',
                            alignItems: 'flex-start'
                        }}
                    >
                        {msg.sender === 'bot' && (
                            <Avatar
                                icon={<RobotOutlined />}
                                style={{
                                    backgroundColor: msg.isError ? '#ff4d4f' : '#4a90e2',
                                    marginRight: '8px',
                                    flexShrink: 0
                                }}
                            />
                        )}

                        <div
                            style={{
                                maxWidth: '70%',
                                padding: '12px 16px',
                                borderRadius: '18px',
                                backgroundColor: msg.sender === 'user' ? '#4a90e2' : 'white',
                                color: msg.sender === 'user' ? 'white' : '#333',
                                border: msg.sender === 'bot' ? '1px solid #e8e8e8' : 'none',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                borderBottomRightRadius: msg.sender === 'user' ? '4px' : '18px',
                                borderBottomLeftRadius: msg.sender === 'bot' ? '4px' : '18px',
                                position: 'relative'
                            }}
                        >
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: formatMessage(msg.text)
                                }}
                                style={{
                                    lineHeight: '1.5',
                                    fontSize: '14px'
                                }}
                            />

                            {msg.sender === 'bot' && (
                                <div style={{
                                    marginTop: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: '12px' }}
                                    >
                                        {msg.timestamp.toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<SoundOutlined />}
                                        onClick={() => speakText(msg.text)}
                                        style={{
                                            color: '#666',
                                            padding: '4px'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {msg.sender === 'user' && (
                            <Avatar
                                icon={<UserOutlined />}
                                style={{
                                    backgroundColor: '#52c41a',
                                    marginLeft: '8px',
                                    flexShrink: 0
                                }}
                            />
                        )}
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        marginBottom: '12px',
                        alignItems: 'center'
                    }}>
                        <Avatar
                            icon={<RobotOutlined />}
                            style={{
                                backgroundColor: '#4a90e2',
                                marginRight: '8px'
                            }}
                        />
                        <div style={{
                            backgroundColor: 'white',
                            padding: '12px 16px',
                            borderRadius: '18px',
                            border: '1px solid #e8e8e8',
                            borderBottomLeftRadius: '4px'
                        }}>
                            <Spin size="small" />
                            <Text style={{ marginLeft: '8px', color: '#666' }}>
                                Đang soạn tin nhắn...
                            </Text>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid #e8e8e8',
                backgroundColor: 'white',
                borderRadius: '0 0 8px 8px'
            }}>
                <Space.Compact style={{ width: '100%' }}>
                    <Input
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Hỏi về triệu chứng, bệnh tật..."
                        disabled={loading}
                        style={{
                            borderRadius: '20px 0 0 20px',
                            border: '1px solid #d9d9d9'
                        }}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={sendMessage}
                        loading={loading}
                        style={{
                            borderRadius: '0 20px 20px 0',
                            background: '#4a90e2',
                            borderColor: '#4a90e2'
                        }}
                    />
                </Space.Compact>

                <div style={{
                    marginTop: '8px',
                    textAlign: 'center'
                }}>
                    <Text
                        type="secondary"
                        style={{ fontSize: '11px' }}
                    >
                        💡 Gợi ý: "Triệu chứng cảm cúm", "Cách phòng ngừa COVID-19"
                    </Text>
                </div>
            </div>
        </Card>
    );
};

export default ChatbotComponent;