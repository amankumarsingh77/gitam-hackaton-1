import React from 'react';
import { motion } from 'framer-motion';

function ProgressBar({ currentStep, totalSteps }) {
    const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
    const progress = Math.round((currentStep / totalSteps) * 100);

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                    <span className="font-medium text-sm text-slate-700">Progress</span>
                    <div className="ml-2 px-2 py-0.5 bg-slate-100 rounded-md">
                        <span className="text-xs font-semibold text-slate-700">{progress}%</span>
                    </div>
                </div>
                <div className="text-xs text-slate-500">
                    Step {currentStep} of {totalSteps}
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-slate-500 to-slate-700 rounded-full"
                />
            </div>

            {/* Step indicators */}
            <div className="flex justify-between mt-2">
                {steps.map(step => (
                    <div
                        key={step}
                        className={`relative flex flex-col items-center ${step <= currentStep ? 'text-slate-700' : 'text-slate-400'}`}
                    >
                        <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center z-10
                ${step < currentStep ? 'bg-slate-700' : step === currentStep ? 'bg-white border-2 border-slate-700' : 'bg-slate-200'}`}
                        >
                            {step < currentStep && (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            )}
                        </div>
                        <span className="text-xs mt-1 font-medium">
                            {step === 1 ? 'Overview' : step === 2 ? 'Content' : 'Summary'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ProgressBar; 