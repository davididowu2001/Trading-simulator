package trade

// import (
// 	"encoding/json"
// 	"net/http"
// 	"strings"

// 	"github.com/david/trading-simulator/internal/database"
// 	"github.com/david/trading-simulator/internal/models"
// 	"github.com/golang-jwt/jwt/v5"
// 	finnhub "github.com/Finnhub-Stock-API/finnhub-go/v2"
// )

// type BuyRequest struct {
// 	Ticker string `json:"ticker"`
// 	Shares float64 `json:"shares"`
// }

// func Buy (w http.ResponseWriter, r *http.Request) {
	
// 	var trade models.Trade
// 	json.NewDecoder(r.Body).Decode(&trade)

// 	var user models.User
// 	json.NewDecoder(r.Body).Decode(&user)

// 	if
// }

// // POST /trade/buy + JWT
// // → Middleware validates JWT
// // → Get user from database
// // → Fetch live price from Finnhub
// // → Calculate total cost (shares × live price)
// // → Check user balance >= total cost
// // → If not enough → return 400
// // → If enough:
// //    → Start transaction
// //    → Deduct balance from users table
// //    → Save to trades table
// //    → Update or insert positions table
// //    → Commit transaction
// // → Return 201 success