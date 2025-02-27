package service

import (
	"context"
	"encoding/json"
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
			Timeout: 30 * time.Second,
		}
	}
	openaiClient := openai.NewClientWithConfig(openaiConfig)

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
	s.logger.Infof("Generated memes: %v", memes)

	return memes, nil
}

func (s *aiService) GenerateChapterContent(ctx context.Context, prompt string, subject string, grade int) (*models.Chapter, error) {

	analysisPrompt := fmt.Sprintf(`You are an educational content analyzer. Analyze the topic "%s" for grade %d %s students.

Respond ONLY with a JSON object in the following format (no additional text, just the JSON):
{
    "recommended_lessons": 5,
    "complexity_level": "basic",
    "key_concepts": ["concept1", "concept2"],
    "prerequisites": ["prereq1", "prereq2"],
    "learning_outcomes": ["outcome1", "outcome2"]
}

Notes:
- recommended_lessons must be between 3 and 10
- complexity_level must be one of: "basic", "intermediate", "advanced"
- consider grade level, topic complexity, and standard curriculum
- ensure all arrays have at least 2 items
- respond with valid JSON only, no other text`, prompt, grade, subject)

	model := s.geminiClient.GenerativeModel("gemini-2.0-flash")
	model.SetTemperature(0.3)
	model.SetTopK(20)
	model.SetTopP(0.8)
	model.SetMaxOutputTokens(8192)

	analysisResp, err := model.GenerateContent(ctx, genai.Text(analysisPrompt))
	if err != nil {
		return nil, fmt.Errorf("failed to analyze topic: %w", err)
	}

	if len(analysisResp.Candidates) == 0 || len(analysisResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("no analysis generated")
	}

	analysisText := string(analysisResp.Candidates[0].Content.Parts[0].(genai.Text))

	analysisText = cleanJSONResponse(analysisText)

	var analysis struct {
		RecommendedLessons int      `json:"recommended_lessons"`
		ComplexityLevel    string   `json:"complexity_level"`
		KeyConcepts        []string `json:"key_concepts"`
		Prerequisites      []string `json:"prerequisites"`
		LearningOutcomes   []string `json:"learning_outcomes"`
	}
	if err := json.Unmarshal([]byte(analysisText), &analysis); err != nil {
		return nil, fmt.Errorf("failed to parse topic analysis: %w, response: %s", err, analysisText)
	}

	if analysis.RecommendedLessons < 3 || analysis.RecommendedLessons > 10 {
		analysis.RecommendedLessons = 5
	}
	if analysis.ComplexityLevel == "" {
		analysis.ComplexityLevel = "intermediate"
	}

	var allLessons []struct {
		Title              string      `json:"title"`
		Description        string      `json:"description"`
		Content            interface{} `json:"content"`
		Order              int         `json:"order"`
		Difficulty         string      `json:"difficulty"`
		DurationMinutes    int         `json:"duration_minutes"`
		LearningObjectives []string    `json:"learning_objectives"`
	}

	chapterPrompt := fmt.Sprintf(`Create a title and description for a chapter about "%s" for grade %d %s students.
Response format:
{
    "title": "Chapter Title",
    "description": "Chapter overview including prerequisites"
}`, prompt, grade, subject)

	chapterResp, err := model.GenerateContent(ctx, genai.Text(chapterPrompt))
	if err != nil {
		return nil, fmt.Errorf("failed to generate chapter info: %w", err)
	}

	chapterText := cleanJSONResponse(string(chapterResp.Candidates[0].Content.Parts[0].(genai.Text)))
	var chapterInfo struct {
		Title       string `json:"title"`
		Description string `json:"description"`
	}
	if err := json.Unmarshal([]byte(chapterText), &chapterInfo); err != nil {
		return nil, fmt.Errorf("failed to parse chapter info: %w", err)
	}

	lessonsPerChunk := 2
	for i := 0; i < analysis.RecommendedLessons; i += lessonsPerChunk {
		endIdx := i + lessonsPerChunk
		if endIdx > analysis.RecommendedLessons {
			endIdx = analysis.RecommendedLessons
		}

		lessonPrompt := fmt.Sprintf(`Create %d lessons (orders %d-%d) for the chapter about "%s" for grade %d %s students.
Response format:
{
    "lessons": [
        {
            "title": "Lesson Title",
            "description": "Brief overview",
            "content": {
                "introduction": "Hook text",
                "core_concepts": [
                    {
                        "title": "Concept Title",
                        "explanation": "Clear explanation",
                        "real_world_example": "Example",
                        "fun_fact": "Fun fact"
                    }
                ],
                "interactive_elements": [
                    {
                        "type": "activity",
                        "title": "Activity Title",
                        "description": "Instructions",
                        "materials_needed": ["item1"],
                        "expected_outcome": "Learning outcome"
                    }
                ],
                "summary": "Summary text",
                "challenge": "Challenge text"
            },
            "order": %d,
            "difficulty": "basic",
            "duration_minutes": 30,
            "learning_objectives": ["objective1", "objective2"]
        }
    ]
}

Notes:
- Make content engaging and grade-appropriate
- Include real-world examples and fun facts
- Each lesson should build on previous ones
- Ensure proper order numbers (%d-%d)`, endIdx-i, i+1, endIdx, prompt, grade, subject, i+1, i+1, endIdx)

		lessonResp, err := model.GenerateContent(ctx, genai.Text(lessonPrompt))
		if err != nil {
			return nil, fmt.Errorf("failed to generate lessons %d-%d: %w", i+1, endIdx, err)
		}

		lessonText := cleanJSONResponse(string(lessonResp.Candidates[0].Content.Parts[0].(genai.Text)))
		var lessonChunk struct {
			Lessons []struct {
				Title              string      `json:"title"`
				Description        string      `json:"description"`
				Content            interface{} `json:"content"`
				Order              int         `json:"order"`
				Difficulty         string      `json:"difficulty"`
				DurationMinutes    int         `json:"duration_minutes"`
				LearningObjectives []string    `json:"learning_objectives"`
			} `json:"lessons"`
		}

		if err := json.Unmarshal([]byte(lessonText), &lessonChunk); err != nil {
			return nil, fmt.Errorf("failed to parse lessons %d-%d: %w, content: %s", i+1, endIdx, err, lessonText)
		}

		allLessons = append(allLessons, lessonChunk.Lessons...)
	}

	chapter := &models.Chapter{
		Title:       chapterInfo.Title,
		Description: chapterInfo.Description,
		Grade:       grade,
		Subject:     subject,
		Order:       0,
		IsCustom:    true,
	}

	var lessons []*models.Lesson
	for _, l := range allLessons {

		var objectives strings.Builder
		objectives.WriteString("Objectives:")
		for i, obj := range l.LearningObjectives {
			if i < 3 {
				objectives.WriteString(fmt.Sprintf("\n• %s", obj))
			}
		}

		var content strings.Builder
		if contentObj, ok := l.Content.(map[string]interface{}); ok {

			if intro, ok := contentObj["introduction"].(string); ok {
				content.WriteString("📚 Introduction:\n")
				content.WriteString(intro)
				content.WriteString("\n\n")
			}

			if concepts, ok := contentObj["core_concepts"].([]interface{}); ok {
				content.WriteString("🎯 Core Concepts:\n\n")
				for _, c := range concepts {
					if concept, ok := c.(map[string]interface{}); ok {
						content.WriteString(fmt.Sprintf("📍 %s\n", concept["title"]))
						content.WriteString(fmt.Sprintf("%s\n\n", concept["explanation"]))
						content.WriteString(fmt.Sprintf("🌟 Real-World Example: %s\n", concept["real_world_example"]))
						content.WriteString(fmt.Sprintf("💡 Fun Fact: %s\n\n", concept["fun_fact"]))
					}
				}
			}

			if activities, ok := contentObj["interactive_elements"].([]interface{}); ok {
				content.WriteString("🎮 Interactive Activities:\n\n")
				for _, a := range activities {
					if activity, ok := a.(map[string]interface{}); ok {
						content.WriteString(fmt.Sprintf("🔸 %s\n", activity["title"]))
						content.WriteString(fmt.Sprintf("%s\n\n", activity["description"]))
						if materials, ok := activity["materials_needed"].([]interface{}); ok {
							content.WriteString("Materials needed:\n")
							for _, m := range materials {
								content.WriteString(fmt.Sprintf("- %s\n", m))
							}
						}
						content.WriteString(fmt.Sprintf("\nWhat you'll learn: %s\n\n", activity["expected_outcome"]))
					}
				}
			}

			if summary, ok := contentObj["summary"].(string); ok {
				content.WriteString("📝 Summary:\n")
				content.WriteString(summary)
				content.WriteString("\n\n")
			}
			if challenge, ok := contentObj["challenge"].(string); ok {
				content.WriteString("🌟 Extra Challenge:\n")
				content.WriteString(challenge)
			}
		} else {
			content.WriteString(fmt.Sprintf("%v", l.Content))
		}

		lesson := &models.Lesson{
			Title: l.Title,
			Description: fmt.Sprintf("%s\n\n%s\n[%d min | %s]",
				strings.Split(l.Description, ".")[0],
				objectives.String(),
				l.DurationMinutes,
				strings.Title(l.Difficulty)),
			Content:  content.String(),
			Grade:    grade,
			Subject:  subject,
			Order:    l.Order,
			IsCustom: true,
		}
		lessons = append(lessons, lesson)
	}
	chapter.Lessons = lessons

	return chapter, nil
}

func cleanJSONResponse(response string) string {
	// Remove any markdown code block markers (including backticks)
	response = strings.TrimPrefix(response, "```json")
	response = strings.TrimPrefix(response, "```javascript")
	response = strings.TrimPrefix(response, "```js")
	response = strings.TrimPrefix(response, "```")
	response = strings.TrimSuffix(response, "```")

	// Remove any leading/trailing whitespace
	response = strings.TrimSpace(response)

	// Remove any BOM or invisible characters
	response = strings.TrimPrefix(response, "\uFEFF")

	// Handle potential line endings
	response = strings.ReplaceAll(response, "\r\n", "\n")
	response = strings.ReplaceAll(response, "\r", "\n")

	// Remove backticks that might be in the content
	response = strings.ReplaceAll(response, "`", "")

	// Remove any comments that might have been included
	lines := strings.Split(response, "\n")
	var cleanLines []string
	for _, line := range lines {
		trimmedLine := strings.TrimSpace(line)
		if !strings.HasPrefix(trimmedLine, "//") && !strings.HasPrefix(trimmedLine, "#") {
			cleanLines = append(cleanLines, line)
		}
	}
	response = strings.Join(cleanLines, "\n")

	// Validate JSON structure
	if !json.Valid([]byte(response)) {
		// Try to fix common JSON issues
		response = strings.ReplaceAll(response, "'", "\"") // Replace single quotes with double quotes
		response = strings.ReplaceAll(response, "’", "\"") // Replace smart quotes
		response = strings.ReplaceAll(response, "”", "\"")
		response = strings.ReplaceAll(response, "…", "...") // Replace ellipsis
		response = strings.ReplaceAll(response, "–", "-")   // Replace en-dash
		response = strings.ReplaceAll(response, "—", "-")   // Replace em-dash
	}

	return response
}

func (s *aiService) GenerateQuizContent(ctx context.Context, lessonContent string) (*models.Quiz, []*models.Question, error) {
	quizPrompt := fmt.Sprintf(`You are a educational quiz creator, Create a quiz for the following lesson content: %s. 
	Respond ONLY with a JSON object in the following format(no additional text, just the JSON):
	"quiz": {
		"title": "Quiz Title",
		"description": "Quiz description",
		"time_limit": 500
	},
	"questions": [
		{
			"text" : "Question text here",
			"question_type": "multiple_choice",
			"options": ["option1","option2","option3","option4"],
			"answer": "correct answer",
			"explanation": "explanation of the answer",
			"points": 5
			"difficulty":"easy",

		}

	]
Notes: 
- Create 10 questions for the quiz
- text should be related to the lesson content
- question_type should be multiple_choice or fill in the blanks (with options) or true/false
- options should be related to the question
- answer should be related to the question
- explanation should be related to the answer
- points should be related to the difficulty of the question(easy: 5, medium: 10 ,hard: 15)
- time_limit should be from (300-900 seconds)
- difficulty should be easy, medium, hard
- generate the quiz in such a way that 5 easy questions, 3 medium questions, 2 hard questions

	}`, lessonContent)
	model := s.geminiClient.GenerativeModel("gemini-2.0-flash")
	model.SetTemperature(0.3)
	model.SetTopK(20)
	model.SetTopP(0.8)
	model.SetMaxOutputTokens(8192)

	quizResp, err := model.GenerateContent(ctx, genai.Text(quizPrompt))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate quiz: %w", err)
	}

	if len(quizResp.Candidates) == 0 || len(quizResp.Candidates[0].Content.Parts) == 0 {
		return nil, nil, fmt.Errorf("no quiz generated")
	}

	quizText := cleanJSONResponse(string(quizResp.Candidates[0].Content.Parts[0].(genai.Text)))

	var result struct {
		Quiz struct {
			Title       string `json:"title"`
			Description string `json:"description"`
			TimeLimit   int    `json:"time_limit"`
		} `json:"quiz"`
		Questions []struct {
			Text         string   `json:"text"`
			QuestionType string   `json:"question_type"`
			Options      []string `json:"options"`
			Answer       string   `json:"answer"`
			Explanation  string   `json:"explanation"`
			Points       int      `json:"points"`
			Difficulty   string   `json:"difficulty"`
		} `json:"questions"`
	}

	if err := json.Unmarshal([]byte(quizText), &result); err != nil {
		return nil, nil, fmt.Errorf("failed to parse quiz: %w", err)
	}

	quiz := &models.Quiz{
		Title:       result.Quiz.Title,
		Description: result.Quiz.Description,
		TimeLimit:   &result.Quiz.TimeLimit,
	}

	var questions []*models.Question
	for _, q := range result.Questions {
		question := &models.Question{
			Text:         q.Text,
			QuestionType: q.QuestionType,
			Options:      q.Options,
			Answer:       q.Answer,
			Explanation:  q.Explanation,
		}
		questions = append(questions, question)

	}
	if len(questions) == 0 {
		return nil, nil, fmt.Errorf("no questions generated")
	}



	return quiz, questions, nil
}
