import React from 'react';
import { motion } from 'framer-motion';

function LoadingSpinner() {
    return (
        <div className="flex flex-col justify-center items-center h-64">
            <div className="relative w-16 h-16">
                {/* Outer circle */}
                <motion.div
                    className="absolute inset-0 border-4 border-slate-200 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />

                {/* Spinning arc */}
                <motion.div
                    className="absolute inset-0 border-4 border-transparent border-t-slate-600 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1.2,
                        ease: "linear",
                        repeat: Infinity
                    }}
                />
            </div>
            <p className="mt-4 text-slate-600 font-medium">Loading content...</p>
        </div>
    );
}

export default LoadingSpinner; 