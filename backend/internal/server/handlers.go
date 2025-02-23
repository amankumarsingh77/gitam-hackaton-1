package server

import (
	"net/http"
	"strings"

	"github.com/AleksK1NG/api-mc/docs"
	"github.com/AleksK1NG/api-mc/pkg/csrf"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	echoSwagger "github.com/swaggo/echo-swagger"

	// _ "github.com/AleksK1NG/api-mc/docs"
	authHttp "github.com/AleksK1NG/api-mc/internal/auth/delivery/http"
	authRepository "github.com/AleksK1NG/api-mc/internal/auth/repository"
	authUseCase "github.com/AleksK1NG/api-mc/internal/auth/usecase"
	chapterHttp "github.com/AleksK1NG/api-mc/internal/chapter/delivery/http"
	chapterRepository "github.com/AleksK1NG/api-mc/internal/chapter/repository"
	chapterService "github.com/AleksK1NG/api-mc/internal/chapter/service"
	chapterUseCase "github.com/AleksK1NG/api-mc/internal/chapter/usecase"
	apiMiddlewares "github.com/AleksK1NG/api-mc/internal/middleware"
	sessionRepository "github.com/AleksK1NG/api-mc/internal/session/repository"
	"github.com/AleksK1NG/api-mc/internal/session/usecase"
	"github.com/AleksK1NG/api-mc/pkg/metric"
	"github.com/AleksK1NG/api-mc/pkg/utils"
)

// Map Server Handlers
func (s *Server) MapHandlers(e *echo.Echo) error {
	metrics, err := metric.CreateMetrics(s.cfg.Metrics.URL, s.cfg.Metrics.ServiceName)
	if err != nil {
		s.logger.Errorf("CreateMetrics Error: %s", err)
	}
	s.logger.Info(
		"Metrics available URL: %s, ServiceName: %s",
		s.cfg.Metrics.URL,
		s.cfg.Metrics.ServiceName,
	)

	// Init repositories
	aRepo := authRepository.NewAuthRepository(s.db)
	sRepo := sessionRepository.NewSessionRepository(s.redisClient, s.cfg)
	authRedisRepo := authRepository.NewAuthRedisRepository(s.redisClient)
	chapterRepo := chapterRepository.NewChapterRepository(s.db)

	// Init AI service
	aiService, err := chapterService.NewAIService(s.cfg, s.logger)
	if err != nil {
		return err
	}

	// Init useCases
	authUC := authUseCase.NewAuthUseCase(s.cfg, aRepo, authRedisRepo, s.logger)
	sessUC := usecase.NewSessionUseCase(sRepo, s.cfg)
	chapterUC := chapterUseCase.NewChapterUseCase(s.cfg, chapterRepo, aiService, s.logger)

	// Init handlers
	authHandlers := authHttp.NewAuthHandlers(s.cfg, authUC, sessUC, s.logger)
	chapterHandlers := chapterHttp.NewChapterHandlers(s.cfg, chapterUC, s.logger)

	mw := apiMiddlewares.NewMiddlewareManager(sessUC, authUC, s.cfg, []string{"*"}, s.logger)

	e.Use(mw.RequestLoggerMiddleware)

	docs.SwaggerInfo.Title = "Go example REST API"
	e.GET("/swagger/*", echoSwagger.WrapHandler)

	if s.cfg.Server.SSL {
		e.Pre(middleware.HTTPSRedirect())
	}

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderXRequestID, csrf.CSRFHeader},
	}))
	e.Use(middleware.RecoverWithConfig(middleware.RecoverConfig{
		StackSize:         1 << 10, // 1 KB
		DisablePrintStack: true,
		DisableStackAll:   true,
	}))
	e.Use(middleware.RequestID())
	e.Use(mw.MetricsMiddleware(metrics))

	e.Use(middleware.GzipWithConfig(middleware.GzipConfig{
		Level: 5,
		Skipper: func(c echo.Context) bool {
			return strings.Contains(c.Request().URL.Path, "swagger")
		},
	}))
	e.Use(middleware.Secure())
	e.Use(middleware.BodyLimit("2M"))
	if s.cfg.Server.Debug {
		e.Use(mw.DebugMiddleware)
	}

	v1 := e.Group("/api/v1")

	health := v1.Group("/health")
	authGroup := v1.Group("/auth")
	chapterGroup := v1.Group("/chapters")

	// Map routes
	authHttp.MapAuthRoutes(authGroup, authHandlers, mw)
	chapterHttp.MapChapterRoutes(chapterGroup, chapterHandlers, mw)

	health.GET("", func(c echo.Context) error {
		s.logger.Infof("Health check RequestID: %s", utils.GetRequestID(c))
		return c.JSON(http.StatusOK, map[string]string{"status": "OK"})
	})

	return nil
}
