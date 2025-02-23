package redis

import (
	"crypto/tls"
	"time"

	"github.com/go-redis/redis/v8"

	"github.com/AleksK1NG/api-mc/config"
)

// Returns new redis client
func NewRedisClient(cfg *config.Config) *redis.Client {
	redisHost := cfg.Redis.RedisAddr

	if redisHost == "" {
		redisHost = ":6379"
	}

	client := redis.NewClient(&redis.Options{
		Addr:         redisHost,
		MinIdleConns: cfg.Redis.MinIdleConns,
		PoolSize:     cfg.Redis.PoolSize,
		PoolTimeout:  time.Duration(cfg.Redis.PoolTimeout) * time.Second,
		Password:     cfg.Redis.Password, // no password set
		DB:           cfg.Redis.DB,
		TLSConfig: &tls.Config{
			InsecureSkipVerify: true,
		}, // use default DB
	})

	return client
}
