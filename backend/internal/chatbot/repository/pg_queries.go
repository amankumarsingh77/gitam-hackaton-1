package repository

// SQL queries for the chatbot repository

const (
	// Query to insert a new chat history entry
	CreateChatHistoryQuery = `
		INSERT INTO chat_history (id, user_id, prompt, response, created_at) 
		VALUES ($1, $2, $3, $4, $5)
	`

	// Query to retrieve chat history for a specific user
	GetChatHistoryByUserIDQuery = `
		SELECT id, user_id, prompt, response, created_at 
		FROM chat_history 
		WHERE user_id = $1 
		ORDER BY created_at DESC
	`
)
