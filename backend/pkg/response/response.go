package response

// Response represents a standard API response structure
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// Success creates a successful response with data
func Success(data interface{}) Response {
	return Response{
		Success: true,
		Data:    data,
	}
}

// SuccessWithMessage creates a successful response with data and a message
func SuccessWithMessage(message string, data interface{}) Response {
	return Response{
		Success: true,
		Message: message,
		Data:    data,
	}
}

// Error creates an error response with an error message
func Error(message string) Response {
	return Response{
		Success: false,
		Error:   message,
	}
}

// ErrorWithData creates an error response with an error message and data
func ErrorWithData(message string, data interface{}) Response {
	return Response{
		Success: false,
		Error:   message,
		Data:    data,
	}
}
