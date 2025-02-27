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

type LessonContent struct {
	Title              string      `json:"title"`
	Description        string      `json:"description"`
	Content            interface{} `json:"content"`
	Order              int         `json:"order"`
	Difficulty         string      `json:"difficulty"`
	DurationMinutes    int         `json:"duration_minutes"`
	ImagePrompts       []string    `json:"image_prompts"`
	LearningObjectives []string    `json:"learning_objectives"`
}

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

	var allLessons []LessonContent

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

Each lesson should follow a consistent structure with clear section markers for easy frontend rendering.

Response format:
{
    "lessons": [
        {
            "title": "Lesson Title",
            "description": "Brief overview",
            "content": {
                "introduction": "Introduction:\nEngaging hook text that introduces the topic and why it matters. This should be 2-3 paragraphs with clear explanations suitable for the grade level.",
                "core_concepts": [
                    {
                        "title": "Concept Title",
                        "explanation": "Clear explanation with examples and analogies appropriate for grade %d students. Use simple language and build on prior knowledge.",
                        "real_world_example": "Concrete example showing how this concept applies in the real world",
                        "fun_fact": "Interesting and memorable fact related to this concept"
                    }
                ],
                "visual_elements": [
                    {
                        "type": "diagram",
                        "description": "Description of what the diagram should show",
                        "caption": "Explanatory caption for the diagram"
                    }
                ],
                "interactive_elements": [
                    {
                        "type": "activity",
                        "title": "Activity Title",
                        "description": "Clear step-by-step instructions",
                        "materials_needed": ["item1", "item2"],
                        "expected_outcome": "What students will learn from this activity"
                    }
                ],
                "summary": "Concise summary of key points covered in the lesson, reinforcing the main concepts",
                "challenge": "Optional extension activity or thought-provoking question to deepen understanding"
            },
            "order": %d,
            "difficulty": "basic",
            "duration_minutes": 30,
            "image_prompts": ["Generate an educational illustration showing...", "Create a visual representation of..."],
            "learning_objectives": ["Students will be able to...", "Students will understand..."]
        }
    ]
}

Important formatting guidelines:
1. Use clear section headers for different content areas (Introduction, Core Concepts, etc.)
2. Keep paragraphs short (3-5 sentences) for better readability
3. Include code examples with proper formatting using triple backticks where appropriate
4. Use bullet points for lists
5. Ensure content is engaging, accurate, and grade-appropriate
6. Each lesson should build logically on previous ones
7. Include clear learning objectives that are measurable
8. Make image prompts specific enough to generate relevant educational illustrations`, endIdx-i, i+1, endIdx, prompt, grade, subject, grade, i+1)

		lessonResp, err := model.GenerateContent(ctx, genai.Text(lessonPrompt))
		if err != nil {
			return nil, fmt.Errorf("failed to generate lessons %d-%d: %w", i+1, endIdx, err)
		}

		lessonText := cleanJSONResponse(string(lessonResp.Candidates[0].Content.Parts[0].(genai.Text)))
		var lessonChunk struct {
			Lessons []LessonContent `json:"lessons"`
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
				content.WriteString(intro)
				content.WriteString("\n\n")
			}

			if concepts, ok := contentObj["core_concepts"].([]interface{}); ok {
				content.WriteString("Core Concepts:\n\n")
				for _, c := range concepts {
					if concept, ok := c.(map[string]interface{}); ok {
						content.WriteString(fmt.Sprintf("%s\n", concept["title"]))
						content.WriteString(fmt.Sprintf("%s\n\n", concept["explanation"]))
						content.WriteString(fmt.Sprintf("Real-World Example: %s\n", concept["real_world_example"]))
						content.WriteString(fmt.Sprintf("Fun Fact: %s\n\n", concept["fun_fact"]))
					}
				}
			}

			// Visual elements section
			if visuals, ok := contentObj["visual_elements"].([]interface{}); ok && len(visuals) > 0 {
				content.WriteString("Visual Aids:\n")
				for _, v := range visuals {
					if visual, ok := v.(map[string]interface{}); ok {
						content.WriteString(fmt.Sprintf("• %s: %s\n", visual["type"], visual["description"]))
						if caption, ok := visual["caption"].(string); ok {
							content.WriteString(fmt.Sprintf("  Caption: %s\n", caption))
						}
					}
				}
				content.WriteString("\n")
			}

			// Generate images for each prompt
			if len(l.ImagePrompts) > 0 {
				if _, ok := contentObj["visual_elements"]; !ok {
					content.WriteString("Visual Aids:\n")
				}
				for _, prompt := range l.ImagePrompts {
					content.WriteString(fmt.Sprintf("• %s\n", prompt))

					// Only generate images if OpenAI API key is available
					if s.cfg.OpenAI.APIKey != "" {
						media, err := s.GenerateImageFromPrompt(ctx, prompt)
						if err != nil {
							s.logger.Warnf("Failed to generate image for prompt '%s': %v", prompt, err)
							continue
						}
						// The LessonID will be set by the repository layer after the lesson is created
						media.Description = fmt.Sprintf("Generated illustration: %s", prompt)
					}
				}
				content.WriteString("\n")
			}

			if activities, ok := contentObj["interactive_elements"].([]interface{}); ok {
				content.WriteString("Interactive Activities:\n\n")
				for _, a := range activities {
					if activity, ok := a.(map[string]interface{}); ok {
						content.WriteString(fmt.Sprintf("%s\n", activity["title"]))
						content.WriteString(fmt.Sprintf("%s\n\n", activity["description"]))
						if materials, ok := activity["materials_needed"].([]interface{}); ok && len(materials) > 0 {
							content.WriteString("Materials needed:\n")
							for _, m := range materials {
								content.WriteString(fmt.Sprintf("- %s\n", m))
							}
							content.WriteString("\n")
						}
						content.WriteString(fmt.Sprintf("What you'll learn: %s\n\n", activity["expected_outcome"]))
					}
				}
			}

			if summary, ok := contentObj["summary"].(string); ok {
				content.WriteString("Summary:\n")
				content.WriteString(summary)
				content.WriteString("\n\n")
			}
			if challenge, ok := contentObj["challenge"].(string); ok {
				content.WriteString("Extra Challenge:\n")
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

func (s *aiService) GenerateImageFromPrompt(ctx context.Context, prompt string) (*models.LessonMedia, error) {
	req := openai.ImageRequest{
		Prompt:         prompt,
		Size:           openai.CreateImageSize1024x1024,
		N:              1,
		ResponseFormat: openai.CreateImageResponseFormatURL,
	}

	resp, err := s.openaiClient.CreateImage(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to generate image: %w", err)
	}

	if len(resp.Data) == 0 {
		return nil, fmt.Errorf("no image generated")
	}

	media := &models.LessonMedia{
		MediaType:   "image",
		URL:         resp.Data[0].URL,
		Description: fmt.Sprintf("Generated illustration: %s", prompt),
	}

	return media, nil
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

	structuredPrompt := fmt.Sprintf(`You are an educational quiz creator. Create a quiz based on this lesson content:
%s

Respond ONLY with a JSON object in the following format (no additional text, just the JSON):
{
    "quiz": {
        "title": "Quiz Title",
        "description": "Quiz Description",
        "time_limit": 600
    },
    "questions": [
        {
            "text": "Question text here?",
            "question_type": "multiple_choice",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "answer": "Option 1",
            "explanation": "Explanation why Option 1 is correct",
            "points": 10,
            "difficulty": "medium"
        }
    ]
}

Requirements:
- Create exactly 10 questions
- Mix difficulty levels (easy, medium, hard)
- Include both multiple_choice and true_false types
- For multiple choice, provide 4 options
- For true/false, use ["True", "False"] as options
- Points: easy=5, medium=10, hard=15
- Time limit must be between 300 and 900 seconds
- Provide clear explanations
- No markdown, no additional text, just valid JSON`, lessonContent)

	model := s.geminiClient.GenerativeModel("gemini-2.0-flash")
	resp, err := model.GenerateContent(ctx, genai.Text(structuredPrompt))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate quiz: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, nil, fmt.Errorf("no quiz content generated")
	}

	quizText := string(resp.Candidates[0].Content.Parts[0].(genai.Text))

	quizText = strings.TrimPrefix(quizText, "```json")
	quizText = strings.TrimPrefix(quizText, "```")
	quizText = strings.TrimSuffix(quizText, "```")
	quizText = strings.TrimSpace(quizText)

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
		return nil, nil, fmt.Errorf("failed to parse generated quiz: %w", err)
	}

	if result.Quiz.TimeLimit < 300 || result.Quiz.TimeLimit > 900 {
		result.Quiz.TimeLimit = 600
	}

	quiz := &models.Quiz{
		Title:       result.Quiz.Title,
		Description: result.Quiz.Description,
		TimeLimit:   &result.Quiz.TimeLimit,
	}

	var questions []*models.Question
	for _, q := range result.Questions {

		if q.QuestionType != "multiple_choice" && q.QuestionType != "true_false" {
			q.QuestionType = "multiple_choice"
		}

		if q.QuestionType == "true_false" {
			q.Options = []string{"True", "False"}
		} else if len(q.Options) != 4 {
			continue
		}

		points := map[string]int{
			"easy":   5,
			"medium": 10,
			"hard":   15,
		}
		if validPoints, ok := points[q.Difficulty]; ok {
			q.Points = validPoints
		} else {
			q.Points = 10
			q.Difficulty = "medium"
		}

		question := &models.Question{
			Text:         q.Text,
			QuestionType: q.QuestionType,
			Options:      q.Options,
			Answer:       q.Answer,
			Explanation:  q.Explanation,
			Points:       q.Points,
			Difficulty:   q.Difficulty,
		}
		questions = append(questions, question)
	}

	if len(questions) == 0 {
		return nil, nil, fmt.Errorf("no valid questions generated")
	}

	return quiz, questions, nil
}
