import React from 'react';
import { motion } from 'framer-motion';

function ProgressBar({ currentStep, totalSteps }) {
    const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
    const progress = Math.round((currentStep / totalSteps) * 100);

    // Map step numbers to labels
    const getStepLabel = (step) => {
        switch (step) {
            case 1: return 'Overview';
            case 2: return 'Content';
            case 3: return 'Summary';
            default: return `Step ${step}`;
        }
    };

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
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="h-full bg-primary rounded-full"
                />
            </div>

            {/* Step indicators */}
            <div className="flex justify-between mt-4">
                {steps.map(step => {
                    const isActive = step === currentStep;
                    const isCompleted = step < currentStep;

                    return (
                        <div
                            key={step}
                            className="relative flex flex-col items-center"
                        >
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center z-10
                                    ${isCompleted ? 'bg-primary text-white' :
                                        isActive ? 'bg-white border-2 border-primary text-primary' :
                                            'bg-gray-200 text-gray-500'}`}
                            >
                                {isCompleted ? (
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                ) : (
                                    <span className="text-xs font-medium">{step}</span>
                                )}
                            </div>
                            <span className={`text-xs mt-2 font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-slate-700' : 'text-gray-500'}`}>
                                {getStepLabel(step)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ProgressBar; 