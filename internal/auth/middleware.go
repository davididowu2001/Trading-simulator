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

		//get token from header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "missing token", http.StatusUnauthorized)
			return
		}

		// strip Bearer prefix
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "invalid auth header", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimSpace(parts[1])
		fmt.Println("FIRST TOKEN CHAR:", string(tokenString[0]))
		  // verify token
 		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        	return jwtSecret, nil
        })	
		
		fmt.Println("Err:",err)
		if err != nil || !token.Valid {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }

	
		claims:= token.Claims.(jwt.MapClaims)
		username := claims["username"].(string)

		ctx := context.WithValue(r.Context(), "username",username)
		next(w, r.WithContext(ctx))
	
	}
}