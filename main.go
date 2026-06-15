package main

import (
	"fmt"
	"net/http"

	"github.com/david/trading-simulator/internal/auth"
	"github.com/david/trading-simulator/internal/database"
)



func main() {
    database.Connect()
    database.CreateTables()

    http.HandleFunc("auth/signup", auth.Signup)

    fmt.Println("Server running on port 8080")
    http.ListenAndServe(":8080", nil)
}