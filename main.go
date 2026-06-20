package main

import (
	"fmt"
	"net/http"

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
    http.ListenAndServe(":8080", nil)
}