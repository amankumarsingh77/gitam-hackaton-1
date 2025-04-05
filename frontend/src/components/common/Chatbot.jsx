import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { getAIResponse, addChatMessage, fetchChatHistory, clearChatHistory } from '../../store/slices/aiSlice';
import ReactMarkdown from 'react-markdown';
import { FiSend, FiX, FiRefreshCw, FiTrash2, FiMessageCircle } from 'react-icons/fi';

function Chatbot({ onClose }) {
    const [message, setMessage] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const dispatch = useDispatch();
    const { chatHistory, isLoadingChat, isLoadingHistory } = useSelector(state => state.ai);

    // Fetch chat history when component mounts
    useEffect(() => {
        dispatch(fetchChatHistory());
    }, [dispatch]);

    // Scroll to bottom whenever chat history updates
    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

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

        // Focus on input field after sending
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const handleClearChat = () => {
        dispatch(clearChatHistory());
    };

    const handleRefreshHistory = () => {
        dispatch(fetchChatHistory());
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    // Determine if we should show the welcome message
    const showWelcomeMessage = chatHistory.length === 0 && !isLoadingHistory;

    return (
        <motion.div
            className="fixed bottom-4 right-4 z-50"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Collapsed state - just show icon */}
            {!isExpanded && (
                <motion.button
                    className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-dark transition-colors duration-300"
                    onClick={toggleExpand}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FiMessageCircle size={24} />
                </motion.button>
            )}

            {/* Expanded state - full chatbot UI */}
            {isExpanded && (
                <motion.div
                    className="bg-white rounded-lg shadow-xl w-80 sm:w-96 flex flex-col overflow-hidden"
                    style={{ height: '500px', maxHeight: '80vh' }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Header */}
                    <div className="bg-primary text-white p-4 flex justify-between items-center">
                        <h3 className="font-heading font-semibold flex items-center">
                            <FiMessageCircle className="mr-2" />
                            Bit Buddy Assistant
                        </h3>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleRefreshHistory}
                                className="text-white hover:text-gray-200 transition-colors p-1"
                                disabled={isLoadingHistory}
                                title="Refresh chat history"
                            >
                                <FiRefreshCw className={isLoadingHistory ? "animate-spin" : ""} size={18} />
                            </button>
                            <button
                                onClick={handleClearChat}
                                className="text-white hover:text-gray-200 transition-colors p-1"
                                title="Clear chat"
                            >
                                <FiTrash2 size={18} />
                            </button>
                            <button
                                onClick={toggleExpand}
                                className="text-white hover:text-gray-200 transition-colors p-1"
                                title="Minimize"
                            >
                                <FiX size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                        {isLoadingHistory ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="loader">Loading history...</div>
                            </div>
                        ) : showWelcomeMessage ? (
                            <div className="text-center text-gray-500 mt-4 p-6 bg-white rounded-lg shadow-sm">
                                <h4 className="font-semibold text-lg mb-2">Welcome to Bit Buddy Assistant!</h4>
                                <p className="mb-4">How can I help you learn today?</p>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    <button
                                        onClick={() => setMessage("Can you explain the quadratic formula?")}
                                        className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-left"
                                    >
                                        Can you explain the quadratic formula?
                                    </button>
                                    <button
                                        onClick={() => setMessage("What are the key concepts in this chapter?")}
                                        className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-left"
                                    >
                                        What are the key concepts in this chapter?
                                    </button>
                                    <button
                                        onClick={() => setMessage("How do I solve this problem step by step?")}
                                        className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-left"
                                    >
                                        How do I solve this problem step by step?
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <AnimatePresence>
                                <div className="space-y-4">
                                    {chatHistory.map((chat, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className={`${chat.role === 'user'
                                                ? 'bg-blue-50 ml-8 border-l-4 border-primary'
                                                : chat.isError
                                                    ? 'bg-red-50 mr-8 border-l-4 border-red-500'
                                                    : 'bg-white mr-8 border-l-4 border-green-500 shadow-sm'
                                                } p-3 rounded-lg`}
                                        >
                                            <div className="text-xs text-slate-700 mb-1">
                                                {chat.role === 'user' ? 'You' : 'Bit Buddy'}
                                                {chat.timestamp && ` • ${new Date(chat.timestamp).toLocaleTimeString()}`}
                                            </div>
                                            <ReactMarkdown className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line">
                                                {chat.content}
                                            </ReactMarkdown>
                                        </motion.div>
                                    ))}

                                    {isLoadingChat && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white p-3 rounded-lg mr-8 border-l-4 border-green-500 shadow-sm"
                                        >
                                            <div className="text-xs text-gray-500 mb-1">Bit Buddy</div>
                                            <div className="flex space-x-2 items-center">
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                                            </div>
                                        </motion.div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                ref={inputRef}
                                disabled={isLoadingChat}
                            />
                            <button
                                type="submit"
                                disabled={isLoadingChat || !message.trim()}
                                className={`p-2 rounded-r-lg ${isLoadingChat || !message.trim()
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-primary text-white hover:bg-primary-dark'
                                    } transition-colors`}
                            >
                                <FiSend size={20} />
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
        </motion.div>
    );
}

export default Chatbot; 