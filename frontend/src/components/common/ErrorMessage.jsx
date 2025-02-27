import React from 'react';

function ErrorMessage({ message, onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg max-w-md w-full">
                <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className="font-bold text-lg text-red-700">Something went wrong</h3>
                        <p className="text-slate-700 mt-2">{message || 'An unexpected error occurred. Please try again later.'}</p>

                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="mt-4 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors inline-flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ErrorMessage; 