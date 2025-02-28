package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	aiplatform "cloud.google.com/go/aiplatform/apiv1"
	aiplatformpb "cloud.google.com/go/aiplatform/apiv1/aiplatformpb"
	"github.com/google/generative-ai-go/genai"
	openai "github.com/sashabaranov/go-openai"
	"google.golang.org/api/option"

	"github.com/AleksK1NG/api-mc/config"
	"github.com/AleksK1NG/api-mc/internal/chapter"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/logger"
	"github.com/google/uuid"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
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
	vertexClient *aiplatform.PredictionClient
	logger       logger.Logger
	s3Client     *s3.S3
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

	creds, err := os.ReadFile("/Users/amankumar/Documents/GitProjects/Go/gitam-hackaton-1/backend/credential.json")
	if err != nil {
		log.Fatalf("Failed to read credentials: %v", err)
	}
	if creds == nil {
		log.Fatalf("Failed to read credentials: %v", err)
	}
	// credential, err := google.CredentialsFromJSON(ctx, creds)
	// if err != nil {
	// 	log.Fatalf("Failed to create credentials: %v", err)
	// }
	client, err := aiplatform.NewPredictionClient(ctx, option.WithCredentialsJSON(creds))
	if err != nil {
		log.Fatalf("Failed to create prediction client: %v", err)
	}

	// Initialize AWS S3 client for Cloudflare R2
	awsConfig := &aws.Config{
		Credentials:      credentials.NewStaticCredentials(cfg.AWS.AccessKey, cfg.AWS.SecretKey, ""),
		Endpoint:         aws.String(cfg.AWS.Endpoint),
		Region:           aws.String(cfg.AWS.Region),
		S3ForcePathStyle: aws.Bool(true), // Required for Cloudflare R2
	}

	// If region is not specified, default to "auto" for Cloudflare R2
	if cfg.AWS.Region == "" {
		awsConfig.Region = aws.String("auto")
	}

	if cfg.AWS.UseSSL {
		awsConfig.DisableSSL = aws.Bool(false)
	} else {
		awsConfig.DisableSSL = aws.Bool(true)
	}

	sess, err := session.NewSession(awsConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	s3Client := s3.New(sess)

	return &aiService{
		cfg:          cfg,
		openaiClient: openaiClient,
		geminiClient: geminiClient,
		vertexClient: client,
		logger:       logger,
		s3Client:     s3Client,
	}, nil
}

func (s *aiService) GenerateMemes(ctx context.Context, topic string, count int, model string) ([]*models.LessonMedia, error) {
	// Initial prompt for meme generation - keep it short
	prompt := fmt.Sprintf("Create a funny and educational meme about %s", topic)
	geminiModel := s.geminiClient.GenerativeModel("gemini-2.0-flash")
	geminiModel.SetTemperature(0.3)
	geminiModel.SetTopK(20)
	geminiModel.SetTopP(0.8)
	geminiModel.SetMaxOutputTokens(8192)

	// Request a concise prompt from Gemini
	promptGeneration := fmt.Sprintf("Create a concise prompt (under 500 characters) for generating a funny and educational meme about %s.", topic)
	promptresp, err := geminiModel.GenerateContent(ctx, genai.Text(promptGeneration))
	if err != nil {
		s.logger.Warnf("Failed to generate enhanced prompt with Gemini: %v. Using default prompt.", err)
	} else if len(promptresp.Candidates) > 0 && len(promptresp.Candidates[0].Content.Parts) > 0 {
		// Use the Gemini-generated prompt for the image generation
		enhancedPrompt := string(promptresp.Candidates[0].Content.Parts[0].(genai.Text))
		if enhancedPrompt != "" {
			// Ensure the prompt is within character limits
			if len(enhancedPrompt) > 950 {
				enhancedPrompt = enhancedPrompt[:950]
				s.logger.Warnf("Truncated Gemini prompt to 950 characters")
			}
			prompt = enhancedPrompt
			s.logger.Infof("Using Gemini-enhanced prompt (%d chars): %s", len(prompt), prompt)
		}
	}

	// Choose image generation service based on model parameter
	if model == "gemini" {
		// Use Vertex AI for image generation
		return s.generateVertexAIImages(ctx, prompt, count, topic)
	} else {
		// Default to OpenAI for image generation
		return s.generateOpenAIImages(ctx, prompt, count, topic)
	}
}

// Helper method to generate images using OpenAI
func (s *aiService) generateOpenAIImages(ctx context.Context, prompt string, count int, topic string) ([]*models.LessonMedia, error) {
	s.logger.Infof("Generating %d memes with OpenAI for topic: %s", count, topic)
	s.logger.Debugf("Using prompt: %s", prompt)

	req := openai.ImageRequest{
		Model:          "dall-e-3",
		Prompt:         prompt,
		Size:           openai.CreateImageSize1024x1024,
		N:              count,
		ResponseFormat: openai.CreateImageResponseFormatURL,
	}

	resp, err := s.openaiClient.CreateImage(ctx, req)
	if err != nil {
		s.logger.Errorf("Failed to generate memes with OpenAI: %v", err)
		return nil, fmt.Errorf("failed to generate memes with OpenAI: %v", err)
	}

	s.logger.Infof("Successfully generated %d images with OpenAI", len(resp.Data))

	var memes []*models.LessonMedia
	for i, img := range resp.Data {
		s.logger.Debugf("Processing image %d: %s", i+1, img.URL)

		// Upload image to Cloudflare R2 and get public URL
		publicURL, err := s.uploadImageToR2(ctx, img.URL, fmt.Sprintf("meme_%s_%d", sanitizeObjectName(topic), i+1))
		if err != nil {
			s.logger.Errorf("Failed to upload image %d to R2: %v", i+1, err)
			// If upload fails, use the original URL
			s.logger.Infof("Using original OpenAI URL as fallback for image %d", i+1)
			meme := &models.LessonMedia{
				MediaType:   "meme",
				URL:         img.URL,
				Description: fmt.Sprintf("Educational meme about %s (#%d)", topic, i+1),
			}
			memes = append(memes, meme)
			continue
		}

		s.logger.Infof("Successfully uploaded image %d to R2: %s", i+1, publicURL)
		meme := &models.LessonMedia{
			MediaType:   "meme",
			URL:         publicURL,
			Description: fmt.Sprintf("Educational meme about %s (#%d)", topic, i+1),
		}
		memes = append(memes, meme)
	}

	return memes, nil
}

// Helper method to generate images using Vertex AI
func (s *aiService) generateVertexAIImages(ctx context.Context, prompt string, count int, topic string) ([]*models.LessonMedia, error) {
	s.logger.Infof("Generating %d memes with Vertex AI for topic: %s", count, topic)
	s.logger.Debugf("Using prompt: %s", prompt)

	// Create the image generation request
	var temp float32 = 0.4
	var topK float32 = 32
	var topP float32 = 1.0
	var candidateCount int32 = int32(count)
	var maxOutputTokens int32 = 2048
	imgRequest := &aiplatformpb.GenerateContentRequest{
		Model: "imagen-3.0-generate-002", // Update with the correct model path
		Contents: []*aiplatformpb.Content{
			{
				Parts: []*aiplatformpb.Part{
					{
						Data: &aiplatformpb.Part_Text{
							Text: prompt,
						},
					},
				},
			},
		},

		GenerationConfig: &aiplatformpb.GenerationConfig{
			Temperature:     &temp,
			TopK:            &topK,
			TopP:            &topP,
			CandidateCount:  &candidateCount,
			MaxOutputTokens: &maxOutputTokens,
		},
	}

	// Make the request to Vertex AI
	response, err := s.vertexClient.GenerateContent(ctx, imgRequest)
	if err != nil {
		s.logger.Errorf("Failed to generate memes with Vertex AI: %v", err)
		return nil, fmt.Errorf("failed to generate memes with Vertex AI: %v", err)
	}

	s.logger.Infof("Successfully received response from Vertex AI with %d candidates", len(response.Candidates))

	var memes []*models.LessonMedia
	sanitizedTopic := sanitizeObjectName(topic)

	// Process the response and extract image URLs
	for i, candidate := range response.Candidates {
		if len(candidate.Content.Parts) == 0 {
			s.logger.Warnf("Candidate %d has no content parts", i+1)
			continue
		}

		// Extract image data from response
		var imageURL string
		for _, part := range candidate.Content.Parts {
			if imgPart, ok := part.Data.(*aiplatformpb.Part_FileData); ok {
				// For this example, assuming the image data is stored somewhere and a URL is returned
				// You may need to upload the image to your storage and generate a URL
				// or extract a URL directly from the response, depending on how Vertex AI returns images
				imageURL = imgPart.FileData.MimeType // This is a placeholder, replace with actual URL extraction logic
				s.logger.Debugf("Found image data in candidate %d", i+1)
				break
			}
		}

		if imageURL == "" {
			s.logger.Warnf("No image URL found in candidate %d", i+1)
			continue
		}

		s.logger.Debugf("Processing image %d from Vertex AI", i+1)

		// Upload image to Cloudflare R2 and get public URL
		publicURL, err := s.uploadImageToR2(ctx, imageURL, fmt.Sprintf("meme_%s_%d", sanitizedTopic, i+1))
		if err != nil {
			s.logger.Errorf("Failed to upload image %d to R2: %v", i+1, err)
			// If upload fails, use the original URL
			s.logger.Infof("Using original Vertex AI URL as fallback for image %d", i+1)
			meme := &models.LessonMedia{
				MediaType:   "meme",
				URL:         imageURL,
				Description: fmt.Sprintf("Educational meme about %s (#%d)", topic, i+1),
			}
			memes = append(memes, meme)
			continue
		}

		s.logger.Infof("Successfully uploaded image %d to R2: %s", i+1, publicURL)
		meme := &models.LessonMedia{
			MediaType:   "meme",
			URL:         publicURL,
			Description: fmt.Sprintf("Educational meme about %s (#%d)", topic, i+1),
		}
		memes = append(memes, meme)
	}

	if len(memes) == 0 {
		s.logger.Errorf("No valid images generated from Vertex AI")
		return nil, fmt.Errorf("no valid images generated from Vertex AI")
	}

	s.logger.Infof("Successfully processed %d images from Vertex AI", len(memes))
	return memes, nil
}

// uploadImageToR2 downloads an image from a URL and uploads it to Cloudflare R2
func (s *aiService) uploadImageToR2(ctx context.Context, imageURL string, objectName string) (string, error) {
	// Create a unique object name with UUID to avoid collisions
	objectID := uuid.New().String()

	// Use bucket name from config or default to "educational-media"
	bucketName := s.cfg.AWS.BucketName
	if bucketName == "" {
		bucketName = "educational-media"
	}

	// Ensure the object name has a proper extension
	if !strings.Contains(objectName, ".") {
		objectName = objectName + ".png" // Default to PNG if no extension
	}

	// Create a unique object key
	objectKey := fmt.Sprintf("%s/%s", objectID, objectName)

	// Download the image from the URL
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, imageURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to download image: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to download image, status: %s", resp.Status)
	}

	// Read the content type
	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "image/png" // Default content type
	}

	// Read the image data into a buffer
	imageData, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read image data: %w", err)
	}

	// Check if the bucket exists, create if it doesn't
	_, err = s.s3Client.HeadBucketWithContext(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(bucketName),
	})

	if err != nil {
		// Bucket doesn't exist, create it
		_, err = s.s3Client.CreateBucketWithContext(ctx, &s3.CreateBucketInput{
			Bucket: aws.String(bucketName),
		})
		if err != nil {
			return "", fmt.Errorf("failed to create bucket: %w", err)
		}

		// Set bucket policy to make objects public
		policy := fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": "*",
					"Action": "s3:GetObject",
					"Resource": "arn:aws:s3:::%s/*"
				}
			]
		}`, bucketName)

		_, err = s.s3Client.PutBucketPolicyWithContext(ctx, &s3.PutBucketPolicyInput{
			Bucket: aws.String(bucketName),
			Policy: aws.String(policy),
		})
		if err != nil {
			s.logger.Warnf("Failed to set bucket policy: %v", err)
			// Continue even if policy setting fails
		}
	}

	// Upload the image to R2
	_, err = s.s3Client.PutObjectWithContext(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(objectKey),
		Body:        bytes.NewReader(imageData),
		ContentType: aws.String(contentType),
		ACL:         aws.String("public-read"), // Make the object publicly accessible
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload image to R2: %w", err)
	}

	// Construct the public URL
	var publicURL string

	// If a custom public URL is provided in the config, use that
	if s.cfg.AWS.PublicURL != "" {
		publicURL = fmt.Sprintf("%s/%s", strings.TrimRight(s.cfg.AWS.PublicURL, "/"), objectKey)
	} else if s.cfg.AWS.MinioEndpoint != "" {
		// If you have a custom domain set up for your R2 bucket
		publicURL = fmt.Sprintf("https://%s/%s/%s", s.cfg.AWS.MinioEndpoint, bucketName, objectKey)
	} else {
		// Default Cloudflare R2 URL format
		publicURL = fmt.Sprintf("https://%s.r2.cloudflarestorage.com/%s", bucketName, objectKey)
	}

	return publicURL, nil
}

func (s *aiService) GenerateChapterContent(ctx context.Context, prompt string, subject string, grade int) (*models.Chapter, error) {

	analysisPrompt := fmt.Sprintf(`You are an educational content analyzer. Analyze the topic "%s" for grade %d %s students.

Respond ONLY with a JSON object in the following format (no additional text, just the JSON):
{
    "recommended_lessons": 5,
    "complexity_level": "basic",
    "key_concepts": ["concept1", "concept2", "concept3", "concept4"],
    "prerequisites": ["prereq1", "prereq2", "prereq3"],
    "learning_outcomes": ["outcome1", "outcome2", "outcome3", "outcome4"]
}

Analysis Guidelines:
- recommended_lessons: Integer between 3 and 8 based on topic scope
- complexity_level: Must be "basic", "intermediate", or "advanced" based on grade level
- key_concepts: 4-6 main concepts that should be covered in the chapter
- prerequisites: 2-4 knowledge areas students should already understand
- learning_outcomes: 4-6 specific, measurable skills students will gain

Consider:
- Grade-appropriate content complexity
- Standard curriculum requirements
- Logical progression of concepts
- Measurable learning objectives
- Appropriate scope for the topic`, prompt, grade, subject)

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

	if analysis.RecommendedLessons < 3 || analysis.RecommendedLessons > 8 {
		analysis.RecommendedLessons = 5
	}
	if analysis.ComplexityLevel == "" {
		analysis.ComplexityLevel = "intermediate"
	}

	var allLessons []LessonContent

	chapterPrompt := fmt.Sprintf(`Create a structured title and description for a chapter about "%s" for grade %d %s students.

Response format:
{
    "title": "Clear and Descriptive Chapter Title",
    "description": "Comprehensive chapter overview that includes:
    - Main topics covered
    - Key learning objectives
    - Prerequisites knowledge
    - Relevance to curriculum
    - Practical applications"
}

Guidelines:
- Title should be concise but descriptive
- Description should be 3-5 sentences
- Include grade-appropriate language
- Highlight practical applications of the content
- Connect to curriculum standards`, prompt, grade, subject)

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

		// Add context about previous lessons for continuity
		var previousLessonContext string
		if i > 0 && len(allLessons) > 0 {
			previousLessonContext = fmt.Sprintf(`
Previous lessons covered:
%s

Ensure these new lessons build upon previous content and maintain logical progression.`, formatPreviousLessons(allLessons))
		}

		// Limit the number of image prompts to avoid rate limits
		lessonPrompt := fmt.Sprintf(`Create %d lessons (orders %d-%d) for the chapter about "%s" for grade %d %s students.%s

Each lesson must follow a consistent, structured format with clear section markers for frontend rendering.

Response format:
{
    "lessons": [
        {
            "title": "Lesson Title",
            "description": "Brief overview of lesson content and goals",
            "content": {
                "introduction": "Introduction:\nConcise introduction that presents the topic and establishes relevance. Include 2-3 paragraphs with clear explanations appropriate for grade level.",
                "core_concepts": [
                    {
                        "title": "Concept Title",
                        "explanation": "Detailed explanation with examples appropriate for grade %d students. Use clear language and build on prior knowledge.",
                        "real_world_example": "Practical application demonstrating how this concept is used in real-world contexts",
                        "key_points": ["Key point 1", "Key point 2", "Key point 3"]
                    }
                ],
                "visual_elements": [
                    {
                        "type": "diagram",
                        "description": "Specific description of what the diagram should illustrate",
                        "caption": "Clear explanatory caption for the diagram"
                    }
                ],
                "interactive_elements": [
                    {
                        "type": "activity",
                        "title": "Activity Title",
                        "description": "Numbered step-by-step instructions for completing the activity",
                        "materials_needed": ["Required item 1", "Required item 2"],
                        "expected_outcome": "Specific learning outcome students will achieve through this activity"
                    }
                ],
                "summary": "Structured summary of key concepts covered in the lesson, reinforcing main learning points",
                "assessment": "Formative assessment questions or tasks to evaluate understanding of lesson content"
            },
            "order": %d,
            "difficulty": "basic",
            "duration_minutes": 30,
            "image_prompts": ["Generate an educational illustration showing specific concept..."],
            "learning_objectives": ["Students will be able to demonstrate specific skill...", "Students will understand specific concept..."]
        }
    ]
}

Lesson Structure Plan:
1. Introduction - Present topic clearly with context and relevance
2. Core Concepts - Present 2-4 key concepts with explanations, examples, and applications
3. Visual Elements - Include 1-2 visual aids that support understanding of core concepts
4. Interactive Elements - Provide 1-2 hands-on activities that reinforce learning
5. Summary - Consolidate key points in a structured format
6. Assessment - Include 2-3 questions or tasks to check understanding

Content Guidelines:
1. Use clear section headers for all content areas
2. Maintain consistent paragraph length (3-5 sentences) for readability
3. Include properly formatted code examples where appropriate
4. Use numbered lists for sequential instructions and bullet points for non-sequential items
5. Ensure content difficulty matches grade level appropriately
6. Structure each lesson to build logically on previous content
7. Create specific, measurable learning objectives
8. IMPORTANT: Provide only ONE image prompt per lesson to avoid rate limits`, endIdx-i, i+1, endIdx, prompt, grade, subject, previousLessonContext, grade, i+1)

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

		// Ensure each lesson has at most 1 image prompt to avoid rate limits
		for i := range lessonChunk.Lessons {
			if len(lessonChunk.Lessons[i].ImagePrompts) > 1 {
				lessonChunk.Lessons[i].ImagePrompts = lessonChunk.Lessons[i].ImagePrompts[:1]
			}
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

						// Handle key points instead of fun facts
						if keyPoints, ok := concept["key_points"].([]interface{}); ok && len(keyPoints) > 0 {
							content.WriteString("Key Points:\n")
							for _, point := range keyPoints {
								content.WriteString(fmt.Sprintf("• %s\n", point))
							}
							content.WriteString("\n")
						}
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

			// Generate images for each prompt - but limit to avoid rate limits
			if len(l.ImagePrompts) > 0 {
				if _, ok := contentObj["visual_elements"]; !ok {
					content.WriteString("Visual Aids:\n")
				}

				// Only include the first image prompt in the content
				if len(l.ImagePrompts) > 0 {
					prompt := l.ImagePrompts[0]
					content.WriteString(fmt.Sprintf("• %s\n", prompt))
				}

				// Note: We don't generate images here anymore to avoid rate limits
				// This is now handled in the usecase layer with proper rate limiting
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

			// Handle assessment section instead of challenge
			if assessment, ok := contentObj["assessment"].(string); ok {
				content.WriteString("Assessment:\n")
				content.WriteString(assessment)
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
	// Always generate only 1 image to avoid rate limits
	req := openai.ImageRequest{
		Model:          "dall-e-3", // Use DALL-E 3 for better quality
		Prompt:         prompt,
		Size:           openai.CreateImageSize1024x1024,
		N:              1, // Always generate only 1 image
		ResponseFormat: openai.CreateImageResponseFormatURL,
	}

	s.logger.Infof("Generating image with prompt: %s", prompt)
	resp, err := s.openaiClient.CreateImage(ctx, req)
	if err != nil {
		s.logger.Errorf("Failed to generate image: %v", err)
		return nil, fmt.Errorf("failed to generate image: %w", err)
	}

	if len(resp.Data) == 0 {
		s.logger.Errorf("No image generated from OpenAI")
		return nil, fmt.Errorf("no image generated")
	}

	s.logger.Infof("Successfully generated image, uploading to R2")

	// Upload image to Cloudflare R2 and get public URL
	sanitizedPrompt := sanitizeObjectName(prompt)
	publicURL, err := s.uploadImageToR2(ctx, resp.Data[0].URL, fmt.Sprintf("illustration_%s", sanitizedPrompt))
	if err != nil {
		s.logger.Errorf("Failed to upload image to R2: %v", err)
		// If upload fails, use the original URL
		s.logger.Infof("Using original OpenAI URL as fallback")
		media := &models.LessonMedia{
			MediaType:   "image",
			URL:         resp.Data[0].URL,
			Description: fmt.Sprintf("Generated illustration: %s", prompt),
		}
		return media, nil
	}

	s.logger.Infof("Successfully uploaded image to R2: %s", publicURL)
	media := &models.LessonMedia{
		MediaType:   "image",
		URL:         publicURL,
		Description: fmt.Sprintf("Generated illustration: %s", prompt),
	}

	return media, nil
}

// sanitizeObjectName removes special characters and limits length for object names
func sanitizeObjectName(name string) string {
	// Replace special characters with underscores
	reg := regexp.MustCompile(`[^a-zA-Z0-9_-]`)
	sanitized := reg.ReplaceAllString(name, "_")

	// Limit length to 50 characters
	if len(sanitized) > 50 {
		sanitized = sanitized[:50]
	}

	return sanitized
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

func formatPreviousLessons(lessons []LessonContent) string {
	var result strings.Builder
	for _, lesson := range lessons {
		result.WriteString(fmt.Sprintf("- Lesson %d: %s\n", lesson.Order, lesson.Title))
		if objectives := lesson.LearningObjectives; len(objectives) > 0 {
			result.WriteString("  Objectives:\n")
			for i, obj := range objectives {
				if i < 2 {
					result.WriteString(fmt.Sprintf("  • %s\n", obj))
				}
			}
		}
	}
	return result.String()
}
