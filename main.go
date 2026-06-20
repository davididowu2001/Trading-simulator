package main

import (
	"fmt"
	"net/http"

	"github.com/rs/cors"

	"github.com/david/trading-simulator/internal/auth"
	"github.com/david/trading-simulator/internal/database"
	"github.com/david/trading-simulator/internal/portfolio"
	"github.com/david/trading-simulator/internal/trade"
	"github.com/joho/godotenv"
)



func main() {
    godotenv.Load()
    database.Connect()
    database.CreateTables()

    trade.GetLivePrice("AAPL")
    http.HandleFunc("/auth/signup", auth.Signup)
    http.HandleFunc("/auth/login", auth.Login)

    http.HandleFunc("/trade/buy", auth.MiddlewareJWT(trade.BuyStock))
    http.HandleFunc("/trade/sell", auth.MiddlewareJWT(trade.SellStock))
    http.HandleFunc("/portfolio", auth.MiddlewareJWT(portfolio.Getporfolio))

    http.HandleFunc("/stocks/search", auth.MiddlewareJWT(trade.SearchStock))
    fmt.Println("Server running on port 8080")
    c := cors.New(cors.Options{
    AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173","http://localhost:5174"}, // Add your React app's URL
    AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowedHeaders:   []string{"Authorization", "Content-Type"},
    AllowCredentials: true,
    })

    handler := c.Handler(http.DefaultServeMux)
    if err := http.ListenAndServe(":8080", handler); err != nil {
        fmt.Println("Server error:", err)
    }
}