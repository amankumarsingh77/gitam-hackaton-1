import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { getAIResponse, addChatMessage } from '../../store/slices/aiSlice';
import ReactMarkdown from 'react-markdown';

function Chatbot({ onClose }) {
    const [message, setMessage] = useState('');
    const dispatch = useDispatch();
    const { chatHistory, isLoadingChat } = useSelector(state => state.ai);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        // Add user message to chat history
        dispatch(addChatMessage({
            role: 'user',
            content: message
        }));

        // Get AI response
        dispatch(getAIResponse(message));

        // Clear input
        setMessage('');
    };

    return (
        <motion.div
            className="bg-white rounded-lg shadow-xl w-80 sm:w-96 h-96 flex flex-col overflow-hidden"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="bg-primary text-white p-4 flex justify-between items-center">
                <h3 className="font-heading font-semibold">MemeLearn Assistant</h3>
                <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200"
                >
                    ✕
                </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
                {chatHistory.length === 0 ? (
                    <div className="text-center text-gray-500 mt-4">
                        <p>How can I help you learn today?</p>
                        <p className="text-sm mt-2">Try asking about programming concepts or how to use MemeLearn.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {chatHistory.map((chat, index) => (
                            <div
                                key={index}
                                className={`${chat.role === 'user'
                                        ? 'bg-gray-100 ml-8'
                                        : 'bg-primary bg-opacity-10 mr-8'
                                    } p-3 rounded-lg`}
                            >
                                <ReactMarkdown className="prose prose-sm">
                                    {chat.content}
                                </ReactMarkdown>
                            </div>
                        ))}

                        {isLoadingChat && (
                            <div className="bg-primary bg-opacity-10 p-3 rounded-lg mr-8">
                                <div className="flex space-x-2 items-center">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="input flex-1"
                    />
                    <button
                        type="submit"
                        disabled={isLoadingChat || !message.trim()}
                        className={`ml-2 btn ${isLoadingChat || !message.trim()
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'btn-primary'
                            }`}
                    >
                        Send
                    </button>
                </div>
            </form>
        </motion.div>
    );
}

export default Chatbot; 