package http

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/opentracing/opentracing-go"
	"github.com/pkg/errors"

	"github.com/AleksK1NG/api-mc/config"
	"github.com/AleksK1NG/api-mc/internal/auth"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/internal/session"
	"github.com/AleksK1NG/api-mc/pkg/csrf"
	"github.com/AleksK1NG/api-mc/pkg/httpErrors"
	"github.com/AleksK1NG/api-mc/pkg/logger"
	"github.com/AleksK1NG/api-mc/pkg/utils"
)

// Auth handlers
type authHandlers struct {
	cfg    *config.Config
	authUC auth.UseCase
	sessUC session.UCSession
	logger logger.Logger
}

// NewAuthHandlers Auth handlers constructor
func NewAuthHandlers(cfg *config.Config, authUC auth.UseCase, sessUC session.UCSession, log logger.Logger) auth.Handlers {
	return &authHandlers{cfg: cfg, authUC: authUC, sessUC: sessUC, logger: log}
}

// Register godoc
// @Summary Register new user
// @Description Register new user in the system
// @Tags Auth
// @Accept json
// @Produce json
// @Param register body models.User true "Register user"
// @Success 201 {object} models.UserWithToken
// @Router /auth/register [post]
func (h *authHandlers) Register() echo.HandlerFunc {
	return func(c echo.Context) error {
		user := &models.User{}
		if err := c.Bind(user); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		userWithToken, err := h.authUC.Register(c.Request().Context(), user)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		return c.JSON(http.StatusCreated, userWithToken)
	}
}

// Login godoc
// @Summary Login user
// @Description Login user in the system
// @Tags Auth
// @Accept json
// @Produce json
// @Param login body models.User true "Login user"
// @Success 200 {object} models.UserWithToken
// @Router /auth/login [post]
func (h *authHandlers) Login() echo.HandlerFunc {
	return func(c echo.Context) error {
		user := &models.User{}
		if err := c.Bind(user); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		userWithToken, err := h.authUC.Login(c.Request().Context(), user)
		if err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
		}

		return c.JSON(http.StatusOK, userWithToken)
	}
}

// Logout godoc
// @Summary Logout user
// @Description logout user removing session
// @Tags Auth
// @Accept  json
// @Produce  json
// @Success 200 {string} string	"ok"
// @Router /auth/logout [post]
func (h *authHandlers) Logout() echo.HandlerFunc {
	return func(c echo.Context) error {
		span, ctx := opentracing.StartSpanFromContext(utils.GetRequestCtx(c), "authHandlers.Logout")
		defer span.Finish()

		cookie, err := c.Cookie("session-id")
		if err != nil {
			if errors.Is(err, http.ErrNoCookie) {
				utils.LogResponseError(c, h.logger, err)
				return c.JSON(http.StatusUnauthorized, httpErrors.NewUnauthorizedError(err))
			}
			utils.LogResponseError(c, h.logger, err)
			return c.JSON(http.StatusInternalServerError, httpErrors.NewInternalServerError(err))
		}

		if err := h.sessUC.DeleteByID(ctx, cookie.Value); err != nil {
			utils.LogResponseError(c, h.logger, err)
			return c.JSON(httpErrors.ErrorResponse(err))
		}

		utils.DeleteSessionCookie(c, h.cfg.Session.Name)

		return c.NoContent(http.StatusOK)
	}
}

// UpdateProfile godoc
// @Summary Update user profile
// @Description Update user profile in the system
// @Tags Profile
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param user body models.User true "Update user"
// @Success 200 {object} models.User
// @Router /profile/{id} [put]
func (h *authHandlers) UpdateProfile() echo.HandlerFunc {
	return func(c echo.Context) error {
		userID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid user ID")
		}

		user := &models.User{}
		if err := c.Bind(user); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		user.UserID = userID

		updatedUser, err := h.authUC.Update(c.Request().Context(), user)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		return c.JSON(http.StatusOK, updatedUser)
	}
}

// UpdateAvatar godoc
// @Summary Update user avatar
// @Description Update user avatar URL
// @Tags Profile
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param avatar body string true "Avatar URL"
// @Success 200 {object} models.User
// @Router /profile/{id}/avatar [put]
func (h *authHandlers) UpdateAvatar() echo.HandlerFunc {
	return func(c echo.Context) error {
		userID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid user ID")
		}

		var input struct {
			AvatarURL string `json:"avatar_url"`
		}
		if err := c.Bind(&input); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		updatedUser, err := h.authUC.UpdateAvatar(c.Request().Context(), userID, input.AvatarURL)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		return c.JSON(http.StatusOK, updatedUser)
	}
}

// GetProfile godoc
// @Summary Get user profile
// @Description Get user profile by ID
// @Tags Profile
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} models.User
// @Router /profile/{id} [get]
func (h *authHandlers) GetProfile() echo.HandlerFunc {
	return func(c echo.Context) error {
		userID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid user ID")
		}

		user, err := h.authUC.GetByID(c.Request().Context(), userID)
		if err != nil {
			return echo.NewHTTPError(http.StatusNotFound, "User not found")
		}

		return c.JSON(http.StatusOK, user)
	}
}

// GetProgress godoc
// @Summary Get user progress
// @Description Get user's learning progress
// @Tags Progress
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param subject query string true "Subject"
// @Param grade query int true "Grade"
// @Success 200 {object} models.UserProgress
// @Router /profile/{id}/progress [get]
func (h *authHandlers) GetProgress() echo.HandlerFunc {
	return func(c echo.Context) error {
		userID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid user ID")
		}

		subject := c.QueryParam("subject")
		if subject == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "Subject is required")
		}

		grade, err := strconv.Atoi(c.QueryParam("grade"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid grade")
		}

		progress, err := h.authUC.GetUserProgress(c.Request().Context(), userID, subject, grade)
		if err != nil {
			return echo.NewHTTPError(http.StatusNotFound, "Progress not found")
		}

		return c.JSON(http.StatusOK, progress)
	}
}

// GetDailyStreak godoc
// @Summary Get user's daily streak
// @Description Get user's learning streak information
// @Tags Progress
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} models.DailyStreak
// @Router /profile/{id}/streak [get]
func (h *authHandlers) GetDailyStreak() echo.HandlerFunc {
	return func(c echo.Context) error {
		userID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid user ID")
		}

		streak, err := h.authUC.GetDailyStreak(c.Request().Context(), userID)
		if err != nil {
			return echo.NewHTTPError(http.StatusNotFound, "Streak not found")
		}

		return c.JSON(http.StatusOK, streak)
	}
}

// GetUserByID godoc
// @Summary get user by id
// @Description get string by ID
// @Tags Auth
// @Accept  json
// @Produce  json
// @Param id path int true "user_id"
// @Success 200 {object} models.User
// @Failure 500 {object} httpErrors.RestError
// @Router /auth/{id} [get]
func (h *authHandlers) GetUserByID() echo.HandlerFunc {
	return func(c echo.Context) error {
		span, ctx := opentracing.StartSpanFromContext(utils.GetRequestCtx(c), "authHandlers.GetUserByID")
		defer span.Finish()

		uID, err := uuid.Parse(c.Param("user_id"))
		if err != nil {
			utils.LogResponseError(c, h.logger, err)
			return c.JSON(httpErrors.ErrorResponse(err))
		}

		user, err := h.authUC.GetByID(ctx, uID)
		if err != nil {
			utils.LogResponseError(c, h.logger, err)
			return c.JSON(httpErrors.ErrorResponse(err))
		}

		return c.JSON(http.StatusOK, user)
	}
}

// GetMe godoc
// @Summary Get user by id
// @Description Get current user by id
// @Tags Auth
// @Accept json
// @Produce json
// @Success 200 {object} models.User
// @Failure 500 {object} httpErrors.RestError
// @Router /auth/me [get]
func (h *authHandlers) GetMe() echo.HandlerFunc {
	return func(c echo.Context) error {
		span, _ := opentracing.StartSpanFromContext(utils.GetRequestCtx(c), "authHandlers.GetMe")
		defer span.Finish()

		user, ok := c.Get("user").(*models.User)
		if !ok {
			utils.LogResponseError(c, h.logger, httpErrors.NewUnauthorizedError(httpErrors.Unauthorized))
			return utils.ErrResponseWithLog(c, h.logger, httpErrors.NewUnauthorizedError(httpErrors.Unauthorized))
		}

		return c.JSON(http.StatusOK, user)
	}
}

// GetCSRFToken godoc
// @Summary Get CSRF token
// @Description Get CSRF token, required auth session cookie
// @Tags Auth
// @Accept json
// @Produce json
// @Success 200 {string} string "Ok"
// @Failure 500 {object} httpErrors.RestError
// @Router /auth/token [get]
func (h *authHandlers) GetCSRFToken() echo.HandlerFunc {
	return func(c echo.Context) error {
		span, _ := opentracing.StartSpanFromContext(utils.GetRequestCtx(c), "authHandlers.GetCSRFToken")
		defer span.Finish()

		sid, ok := c.Get("sid").(string)
		if !ok {
			utils.LogResponseError(c, h.logger, httpErrors.NewUnauthorizedError(httpErrors.Unauthorized))
			return utils.ErrResponseWithLog(c, h.logger, httpErrors.NewUnauthorizedError(httpErrors.Unauthorized))
		}
		token := csrf.MakeToken(sid, h.logger)
		c.Response().Header().Set(csrf.CSRFHeader, token)
		c.Response().Header().Set("Access-Control-Expose-Headers", csrf.CSRFHeader)

		return c.NoContent(http.StatusOK)
	}
}

// UploadAvatar godoc
// @Summary Post avatar
// @Description Post user avatar image
// @Tags Auth
// @Accept  json
// @Produce  json
// @Param file formData file true "Body with image file"
// @Param bucket query string true "aws s3 bucket" Format(bucket)
// @Param id path int true "user_id"
// @Success 200 {string} string	"ok"
// @Failure 500 {object} httpErrors.RestError
// @Router /auth/{id}/avatar [post]
// func (h *authHandlers) UploadAvatar() echo.HandlerFunc {
// 	return func(c echo.Context) error {
// 		span, ctx := opentracing.StartSpanFromContext(utils.GetRequestCtx(c), "authHandlers.UploadAvatar")
// 		defer span.Finish()

// 		bucket := c.QueryParam("bucket")
// 		uID, err := uuid.Parse(c.Param("user_id"))
// 		if err != nil {
// 			utils.LogResponseError(c, h.logger, err)
// 			return c.JSON(httpErrors.ErrorResponse(err))
// 		}

// 		image, err := utils.ReadImage(c, "file")
// 		if err != nil {
// 			utils.LogResponseError(c, h.logger, err)
// 			return c.JSON(httpErrors.ErrorResponse(err))
// 		}

// 		file, err := image.Open()
// 		if err != nil {
// 			utils.LogResponseError(c, h.logger, err)
// 			return c.JSON(httpErrors.ErrorResponse(err))
// 		}
// 		defer file.Close()

// 		binaryImage := bytes.NewBuffer(nil)
// 		if _, err = io.Copy(binaryImage, file); err != nil {
// 			utils.LogResponseError(c, h.logger, err)
// 			return c.JSON(httpErrors.ErrorResponse(err))
// 		}

// 		contentType, err := utils.CheckImageFileContentType(binaryImage.Bytes())
// 		if err != nil {
// 			utils.LogResponseError(c, h.logger, err)
// 			return c.JSON(httpErrors.ErrorResponse(err))
// 		}

// 		reader := bytes.NewReader(binaryImage.Bytes())

// 		updatedUser, err := h.authUC.UploadAvatar(ctx, uID, models.UploadInput{
// 			File:        reader,
// 			Name:        image.Filename,
// 			Size:        image.Size,
// 			ContentType: contentType,
// 			BucketName:  bucket,
// 		})
// 		if err != nil {
// 			utils.LogResponseError(c, h.logger, err)
// 			return c.JSON(httpErrors.ErrorResponse(err))
// 		}

// 		return c.JSON(http.StatusOK, updatedUser)
// 	}
// }
