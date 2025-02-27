import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function MediaGallery({ media, mediaType }) {
    const [selectedImage, setSelectedImage] = useState(null);

    // Filter media by type if specified
    const filteredMedia = mediaType
        ? media?.filter(item => item.media_type === mediaType)
        : media;

    if (!filteredMedia || filteredMedia.length === 0) {
        return null;
    }

    // Handle image click to show fullscreen view
    const handleImageClick = (mediaItem) => {
        setSelectedImage(mediaItem);
    };

    // Close fullscreen view
    const handleClose = () => {
        setSelectedImage(null);
    };

    return (
        <div className="my-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMedia.map((mediaItem, index) => (
                    <motion.div
                        key={mediaItem.media_id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="rounded-lg overflow-hidden shadow-md border border-slate-200 bg-white"
                    >
                        {mediaItem.media_type === 'meme' || mediaItem.media_type === 'image' || mediaItem.media_type === 'diagram' ? (
                            <div
                                className="cursor-pointer"
                                onClick={() => handleImageClick(mediaItem)}
                            >
                                <img
                                    src={mediaItem.url}
                                    alt={mediaItem.description || 'Lesson media'}
                                    className="w-full h-auto object-contain"
                                    loading="lazy"
                                />
                                {mediaItem.description && (
                                    <div className="p-3 bg-slate-50 text-sm text-slate-600">
                                        {mediaItem.description}
                                    </div>
                                )}
                            </div>
                        ) : mediaItem.media_type === 'video' ? (
                            <div className="aspect-video">
                                <iframe
                                    src={mediaItem.url}
                                    title={mediaItem.description || 'Lesson video'}
                                    className="w-full h-full"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                                {mediaItem.description && (
                                    <div className="p-3 bg-slate-50 text-sm text-slate-600">
                                        {mediaItem.description}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4">
                                <a
                                    href={mediaItem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-700 hover:text-slate-900 flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {mediaItem.description || 'View resource'}
                                </a>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Fullscreen image viewer */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
                        onClick={handleClose}
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            className="relative max-w-[90vw] max-h-[90vh] overflow-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-lg z-10"
                                onClick={handleClose}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <img
                                src={selectedImage.url}
                                alt={selectedImage.description || 'Lesson media'}
                                className="w-full h-auto object-contain rounded-lg"
                            />
                            {selectedImage.description && (
                                <div className="p-4 bg-white text-slate-700 mt-2 rounded-lg">
                                    {selectedImage.description}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default MediaGallery; 