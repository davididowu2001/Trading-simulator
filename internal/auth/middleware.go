package auth

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)
func MiddlewareJWT(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var tokenString string

        // 1. Check if token is in the Header (Standard HTTP API)
        authHeader := r.Header.Get("Authorization")
        if authHeader != "" {
            // strip Bearer prefix
            parts := strings.SplitN(authHeader, " ", 2)
            if len(parts) == 2 && parts[0] == "Bearer" {
                tokenString = strings.TrimSpace(parts[1])
            }
        }

        // 2. Fallback: Check if token is in the URL Query String (For WebSockets)
        if tokenString == "" {
            tokenString = r.URL.Query().Get("token")
        }

        // 3. If neither provided a token, kick them out
        if tokenString == "" {
            http.Error(w, "missing token", http.StatusUnauthorized)
            return
        }

        // The rest of your exact verification logic stays exactly the same!
        fmt.Println("FIRST TOKEN CHAR:", string(tokenString[0]))
        
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            return jwtSecret, nil
        })  
        
        fmt.Println("Err:", err)
        if err != nil || !token.Valid {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }

        claims := token.Claims.(jwt.MapClaims)
        username := claims["username"].(string)

        ctx := context.WithValue(r.Context(), "username", username)
        next(w, r.WithContext(ctx))
    }
}