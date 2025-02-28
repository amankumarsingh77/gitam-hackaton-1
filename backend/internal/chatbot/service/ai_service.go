package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/AleksK1NG/api-mc/config"
	"github.com/AleksK1NG/api-mc/internal/chatbot"
	"github.com/AleksK1NG/api-mc/pkg/logger"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type aiService struct {
	cfg          *config.Config
	geminiClient *genai.Client
	logger       logger.Logger
}

func NewAIService(cfg *config.Config, logger logger.Logger) (chatbot.AIService, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	geminiClient, err := genai.NewClient(ctx, option.WithAPIKey(cfg.Gemini.APIKey))
	if err !=nil {
		return nil,fmt.Errorf("failed to create Gemini client: %v",err)
	}
	return &aiService{
		cfg: cfg,
		geminiClient: geminiClient,
		logger: logger,
	},nil
}

func (s *aiService) GetResponse(ctx context.Context, prompt string) (string, error) {
	// Clean the prompt
	cleanedPrompt := cleanPrompt(prompt)
	
	// Create a system prompt
	systemPrompt := fmt.Sprintf(`You are an educational assistant helping students learn. 
	Respond to the following query in a helpful, accurate, and concise manner.
	If you don't know the answer, say so rather than making up information.
	
	User query: %s`, cleanedPrompt)
	
	// Set up the Gemini model
	model := s.geminiClient.GenerativeModel("gemini-1.5-pro")
	model.SetTemperature(0.7)
	model.SetTopK(40)
	model.SetTopP(0.95)
	model.SetMaxOutputTokens(4096)
	
	// Send the prompt to Gemini
	resp, err := model.GenerateContent(ctx, genai.Text(systemPrompt))
	if err != nil {
		s.logger.Errorf("Failed to generate response from Gemini: %v", err)
		return "", fmt.Errorf("failed to generate response: %w", err)
	}
	
	// Check if we got a valid response
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated from AI")
	}
	
	// Extract the text response
	responseText := string(resp.Candidates[0].Content.Parts[0].(genai.Text))
	
	// Log the interaction
	s.logger.Infof("Generated response for prompt: %s", cleanedPrompt)
	
	return responseText, nil
}

// Helper function to clean the prompt
func cleanPrompt(prompt string) string {
	// Remove any leading/trailing whitespace
	cleaned := strings.TrimSpace(prompt)
	
	
	cleaned = strings.ReplaceAll(cleaned, "\x00", "")
	
	// Limit the length if needed
	const maxPromptLength = 4000
	if len(cleaned) > maxPromptLength {
		cleaned = cleaned[:maxPromptLength]
	}
	
	return cleaned
}

