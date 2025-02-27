package server

import (
	"context"
	"net/http"
	_ "net/http/pprof"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/AleksK1NG/api-mc/config"
	_ "github.com/AleksK1NG/api-mc/docs"
	"github.com/AleksK1NG/api-mc/internal/leaderboard"
	leaderboardHttp "github.com/AleksK1NG/api-mc/internal/leaderboard/delivery/http"
	"github.com/AleksK1NG/api-mc/internal/leaderboard/worker"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

const (
	certFile       = "ssl/Server.crt"
	keyFile        = "ssl/Server.pem"
	maxHeaderBytes = 1 << 20
	ctxTimeout     = 5
)

// Server struct
type Server struct {
	echo                *echo.Echo
	cfg                 *config.Config
	db                  *sqlx.DB
	redisClient         *redis.Client
	logger              logger.Logger
	leaderboardWorker   *worker.LeaderboardWorker
	leaderboardUC       leaderboard.UseCase
	leaderboardHandlers leaderboard.Handlers
}

// NewServer New Server constructor
func NewServer(cfg *config.Config, db *sqlx.DB, redisClient *redis.Client, logger logger.Logger, leaderboardUC leaderboard.UseCase) *Server {
	e := echo.New()

	// Configure CORS middleware
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPut, http.MethodPost, http.MethodDelete, http.MethodOptions, http.MethodPatch},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	// Initialize leaderboard worker if leaderboardUC is provided
	var leaderboardWorker *worker.LeaderboardWorker
	var leaderboardHandlers leaderboard.Handlers
	if leaderboardUC != nil {
		leaderboardWorker = worker.NewLeaderboardWorker(leaderboardUC, logger)
		leaderboardHandlers = leaderboardHttp.NewLeaderboardHandlers(leaderboardUC, logger)
	}

	return &Server{
		echo:                e,
		cfg:                 cfg,
		db:                  db,
		redisClient:         redisClient,
		logger:              logger,
		leaderboardWorker:   leaderboardWorker,
		leaderboardUC:       leaderboardUC,
		leaderboardHandlers: leaderboardHandlers,
	}
}

func (s *Server) Run() error {
	if s.cfg.Server.SSL {
		if err := s.MapHandlers(s.echo); err != nil {
			return err
		}

		s.echo.Server.ReadTimeout = time.Second * s.cfg.Server.ReadTimeout
		s.echo.Server.WriteTimeout = time.Second * s.cfg.Server.WriteTimeout

		go func() {
			s.logger.Infof("Server is listening on PORT: %s", s.cfg.Server.Port)
			s.echo.Server.ReadTimeout = time.Second * s.cfg.Server.ReadTimeout
			s.echo.Server.WriteTimeout = time.Second * s.cfg.Server.WriteTimeout
			s.echo.Server.MaxHeaderBytes = maxHeaderBytes
			if err := s.echo.StartTLS(s.cfg.Server.Port, certFile, keyFile); err != nil {
				s.logger.Fatalf("Error starting TLS Server: ", err)
			}
		}()

		go func() {
			s.logger.Infof("Starting Debug Server on PORT: %s", s.cfg.Server.PprofPort)
			if err := http.ListenAndServe(s.cfg.Server.PprofPort, http.DefaultServeMux); err != nil {
				s.logger.Errorf("Error PPROF ListenAndServe: %s", err)
			}
		}()

		// Initialize and start the leaderboard worker
		if s.leaderboardWorker != nil {
			s.leaderboardWorker.Start()
			defer s.leaderboardWorker.Stop()
		}

		quit := make(chan os.Signal, 1)
		signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

		<-quit

		ctx, shutdown := context.WithTimeout(context.Background(), ctxTimeout*time.Second)
		defer shutdown()

		s.logger.Info("Server Exited Properly")
		return s.echo.Server.Shutdown(ctx)
	}

	go func() {
		s.logger.Infof("Server is listening on PORT: %s", s.cfg.Server.Port)
		if err := s.echo.Start(s.cfg.Server.Port); err != nil {
			s.logger.Errorf("Error starting Server: %s", err)
		}
	}()

	// Initialize and start the leaderboard worker
	if s.leaderboardWorker != nil {
		s.leaderboardWorker.Start()
		defer s.leaderboardWorker.Stop()
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	<-quit

	ctx, shutdown := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdown()

	s.logger.Info("Server Exited Properly")
	return s.echo.Shutdown(ctx)
}
