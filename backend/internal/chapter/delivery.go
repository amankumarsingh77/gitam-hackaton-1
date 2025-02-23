package chapter

import "github.com/labstack/echo/v4"

// Chapter HTTP Handlers interface
type Handlers interface {
	// Chapter Management
	CreateChapter() echo.HandlerFunc
	GetChapterByID() echo.HandlerFunc
	GetChaptersBySubject() echo.HandlerFunc
	UpdateChapter() echo.HandlerFunc
	DeleteChapter() echo.HandlerFunc

	// AI Generation
	GenerateChapterWithAI() echo.HandlerFunc
	GenerateMemesForChapter() echo.HandlerFunc
	GenerateQuizForChapter() echo.HandlerFunc

	// Custom Content
	CreateCustomChapter() echo.HandlerFunc
	GetUserCustomChapters() echo.HandlerFunc
}
