package auth

import (
	"context"
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
		tokenString := strings.TrimPrefix(authHeader, "Bearer")
		  // verify token
 		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        	return jwtSecret, nil
        })	

		if err != nil || !token.Valid {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }

		 // token is valid, continue
		claims:= token.Claims.(jwt.MapClaims)
		username := claims["username"].(string)

		ctx := context.WithValue(r.Context(), "username",username)
		next(w, r.WithContext(ctx))
	
	}
}