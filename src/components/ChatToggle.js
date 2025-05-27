// src/components/ChatToggle.js
import React, { useState } from 'react';
import { Button } from 'antd';
import { MessageOutlined, CloseOutlined } from '@ant-design/icons';
import ChatbotComponent from './ChatbotComponent';

const ChatToggle = ({
    position = 'bottom-right',
    chatbotApiUrl = "http://127.0.0.1:8000/api/chatbot"
}) => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    const getPositionStyle = () => {
        const baseStyle = {
            position: 'fixed',
            zIndex: 1000
        };

        switch (position) {
            case 'bottom-right':
                return { ...baseStyle, bottom: 20, right: 20 };
            case 'bottom-left':
                return { ...baseStyle, bottom: 20, left: 20 };
            case 'top-right':
                return { ...baseStyle, top: 80, right: 20 };
            case 'top-left':
                return { ...baseStyle, top: 80, left: 20 };
            default:
                return { ...baseStyle, bottom: 20, right: 20 };
        }
    };

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <div style={getPositionStyle()}>
                <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={isChatOpen ? <CloseOutlined /> : <MessageOutlined />}
                    onClick={toggleChat}
                    style={{
                        width: 60,
                        height: 60,
                        background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                        e.target.style.boxShadow = '0 6px 16px rgba(74, 144, 226, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.3)';
                    }}
                />
            </div>

            {/* Chatbot Component */}
            <ChatbotComponent
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                chatbotApiUrl={chatbotApiUrl}
            />
        </>
    );
};

export default ChatToggle;