package service

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/generative-ai-go/genai"
	openai "github.com/sashabaranov/go-openai"
	"google.golang.org/api/option"

	"github.com/AleksK1NG/api-mc/config"
	"github.com/AleksK1NG/api-mc/internal/chapter"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

type aiService struct {
	cfg          *config.Config
	openaiClient *openai.Client
	geminiClient *genai.Client
	logger       logger.Logger
}

func NewAIService(cfg *config.Config, logger logger.Logger) (chapter.AIService, error) {
	// Configure OpenAI client
	openaiConfig := openai.DefaultConfig(cfg.OpenAI.APIKey)
	if cfg.OpenAI.OrgID != "" {
		openaiConfig.OrgID = cfg.OpenAI.OrgID
	}
	if cfg.OpenAI.Timeout > 0 {
		openaiConfig.HTTPClient = &http.Client{
			Timeout: cfg.OpenAI.Timeout,
		}
	} else {
		openaiConfig.HTTPClient = &http.Client{
			Timeout: 30 * time.Second, // Default timeout
		}
	}
	openaiClient := openai.NewClientWithConfig(openaiConfig)

	// Configure Gemini client
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	geminiClient, err := genai.NewClient(ctx, option.WithAPIKey(cfg.Gemini.APIKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %v", err)
	}

	return &aiService{
		cfg:          cfg,
		openaiClient: openaiClient,
		geminiClient: geminiClient,
		logger:       logger,
	}, nil
}

// Generate memes using OpenAI
func (s *aiService) GenerateMemes(ctx context.Context, topic string, count int) ([]*models.LessonMedia, error) {
	prompt := fmt.Sprintf("Create a funny and educational meme about %s", topic)

	req := openai.ImageRequest{
		Prompt:         prompt,
		Size:           openai.CreateImageSize1024x1024,
		N:              count,
		ResponseFormat: openai.CreateImageResponseFormatURL,
	}

	resp, err := s.openaiClient.CreateImage(ctx, req)
	if err != nil {
		s.logger.Errorf("Failed to generate memes: %v", err)
		return nil, fmt.Errorf("failed to generate memes: %v", err)
	}

	var memes []*models.LessonMedia
	for i, img := range resp.Data {
		meme := &models.LessonMedia{
			MediaType:   "meme",
			URL:         img.URL,
			Description: fmt.Sprintf("Educational meme about %s (#%d)", topic, i+1),
		}
		memes = append(memes, meme)
	}

	return memes, nil
}

// Generate chapter content using Gemini
func (s *aiService) GenerateChapterContent(ctx context.Context, prompt string, subject string, grade int) (*models.Chapter, error) {
	model := s.geminiClient.GenerativeModel(s.cfg.Gemini.Model)
	if model == nil {
		model = s.geminiClient.GenerativeModel("gemini-pro") // Default model
	}

	fullPrompt := fmt.Sprintf(
		"Create an educational chapter about %s for grade %d students. "+
			"Make it fun and engaging, using casual language and examples. "+
			"Format the response exactly as follows:\n"+
			"Title: [Your title here]\n"+
			"Description: [Your description here]\n"+
			"Content: [Your content here]",
		prompt, grade,
	)

	resp, err := model.GenerateContent(ctx, genai.Text(fullPrompt))
	if err != nil {
		s.logger.Errorf("Failed to generate chapter content: %v", err)
		return nil, fmt.Errorf("failed to generate chapter content: %v", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("no content generated")
	}

	// Extract text from response
	content := resp.Candidates[0].Content.Parts[0]
	if content == nil {
		return nil, fmt.Errorf("empty content received")
	}

	text := fmt.Sprintf("%v", content)
	lines := strings.Split(text, "\n")

	var title, description string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "Title:") {
			title = strings.TrimSpace(strings.TrimPrefix(line, "Title:"))
		} else if strings.HasPrefix(line, "Description:") {
			description = strings.TrimSpace(strings.TrimPrefix(line, "Description:"))
		}
	}

	if title == "" || description == "" {
		return nil, fmt.Errorf("failed to parse title or description from generated content")
	}

	chapter := &models.Chapter{
		Title:       title,
		Description: description,
		Subject:     subject,
		Grade:       grade,
		IsCustom:    true,
	}

	return chapter, nil
}

// Generate quiz content using Gemini
func (s *aiService) GenerateQuizContent(ctx context.Context, chapterContent string) (*models.Quiz, []*models.Question, error) {
	model := s.geminiClient.GenerativeModel(s.cfg.Gemini.Model)
	if model == nil {
		model = s.geminiClient.GenerativeModel("gemini-pro") // Default model
	}

	prompt := fmt.Sprintf(
		"Create a quiz based on this content: %s\n"+
			"Generate 5 multiple choice questions. Format each question exactly as follows:\n"+
			"Question: [question text]\n"+
			"A: [option A]\n"+
			"B: [option B]\n"+
			"C: [option C]\n"+
			"D: [option D]\n"+
			"Correct Answer: [A/B/C/D]\n"+
			"Explanation: [explanation text]",
		chapterContent,
	)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		s.logger.Errorf("Failed to generate quiz content: %v", err)
		return nil, nil, fmt.Errorf("failed to generate quiz content: %v", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, nil, fmt.Errorf("no content generated")
	}

	// Create quiz
	quiz := &models.Quiz{
		Title:       "Chapter Quiz",
		Description: "Test your understanding of the chapter",
		TimeLimit:   &[]int{15}[0], // 15 minutes
	}

	// Extract text from response
	content := resp.Candidates[0].Content.Parts[0]
	if content == nil {
		return nil, nil, fmt.Errorf("empty content received")
	}

	quizContent := fmt.Sprintf("%v", content)
	lines := strings.Split(quizContent, "\n")
	var questions []*models.Question
	var currentQuestion *models.Question

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		if strings.HasPrefix(line, "Question:") {
			if currentQuestion != nil && len(currentQuestion.Options) == 4 {
				questions = append(questions, currentQuestion)
			}
			currentQuestion = &models.Question{
				Text:         strings.TrimSpace(strings.TrimPrefix(line, "Question:")),
				QuestionType: "multiple_choice",
				Points:       5,        // Default points
				Difficulty:   "medium", // Default difficulty
				Options:      make([]string, 0, 4),
			}
		} else if strings.HasPrefix(line, "A:") {
			if currentQuestion != nil {
				currentQuestion.Options = append(currentQuestion.Options, strings.TrimSpace(strings.TrimPrefix(line, "A:")))
			}
		} else if strings.HasPrefix(line, "B:") {
			if currentQuestion != nil {
				currentQuestion.Options = append(currentQuestion.Options, strings.TrimSpace(strings.TrimPrefix(line, "B:")))
			}
		} else if strings.HasPrefix(line, "C:") {
			if currentQuestion != nil {
				currentQuestion.Options = append(currentQuestion.Options, strings.TrimSpace(strings.TrimPrefix(line, "C:")))
			}
		} else if strings.HasPrefix(line, "D:") {
			if currentQuestion != nil {
				currentQuestion.Options = append(currentQuestion.Options, strings.TrimSpace(strings.TrimPrefix(line, "D:")))
			}
		} else if strings.HasPrefix(line, "Correct Answer:") {
			if currentQuestion != nil {
				answer := strings.TrimSpace(strings.TrimPrefix(line, "Correct Answer:"))
				// Convert A/B/C/D to the actual option text
				if idx := strings.Index("ABCD", answer); idx >= 0 && idx < len(currentQuestion.Options) {
					currentQuestion.Answer = currentQuestion.Options[idx]
				}
			}
		} else if strings.HasPrefix(line, "Explanation:") {
			if currentQuestion != nil {
				currentQuestion.Explanation = strings.TrimSpace(strings.TrimPrefix(line, "Explanation:"))
			}
		}
	}

	// Append the last question if it's complete
	if currentQuestion != nil && len(currentQuestion.Options) == 4 {
		questions = append(questions, currentQuestion)
	}

	if len(questions) == 0 {
		return nil, nil, fmt.Errorf("no valid questions generated")
	}

	return quiz, questions, nil
}
