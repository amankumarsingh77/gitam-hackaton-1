import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { checkAuthStatus } from '../../store/slices/authSlice';

const PrivateRoute = () => {
    const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
    const location = useLocation();
    const dispatch = useDispatch();

    // Check auth status when accessing protected routes
    useEffect(() => {
        dispatch(checkAuthStatus());
    }, [dispatch, location.pathname]);

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If not authenticated, redirect to login with a message
    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                state={{
                    from: location.pathname,
                    message: "Please log in to access this page."
                }}
                replace
            />
        );
    }

    // If authenticated, render the protected route
    return <Outlet />;
};

export default PrivateRoute; 