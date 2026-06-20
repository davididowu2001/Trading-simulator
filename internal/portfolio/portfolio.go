package portfolio

import (
	"encoding/json"
	"net/http"

	"fmt"

	"github.com/david/trading-simulator/internal/database"
	"github.com/david/trading-simulator/internal/models"
	"github.com/david/trading-simulator/internal/trade"
)

type PositionWithValue struct {
    Ticker       string  `json:"ticker"`
    Shares       float64 `json:"shares"`
    AveragePrice float64 `json:"average_price"`
    CurrentPrice float64 `json:"current_price"`
    CurrentValue float64 `json:"current_value"`
}

func Getporfolio(w http.ResponseWriter, r *http.Request){

	var user models.User

	username := r.Context().Value("username").(string)

	err:= database.DB.Get(&user, "SELECT * FROM users WHERE username = $1", username)
	if err != nil{
		http.Error(w, "User doesnt exist", http.StatusBadRequest)
		return
	}
	var positions []models.Position
	fmt.Printf("user ID: %d\n", user.ID)
	err = database.DB.Select(&positions, "SELECT * FROM positions WHERE user_id = $1", user.ID)	
	if err != nil {
		http.Error(w, "You don't own this stock", http.StatusBadRequest)
		return
	}
	
	var enrichedPositions []PositionWithValue
	for _,pos := range positions {
		price,_ := trade.GetLivePrice(pos.Ticker)
		enrichedPositions = append(enrichedPositions, PositionWithValue{
			Ticker: pos.Ticker,
			Shares: pos.Shares,
			AveragePrice: pos.AveragePrice,
			CurrentPrice: price,
			CurrentValue: price * pos.Shares,
		})
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"balance":   user.Balance,
		"positions": enrichedPositions,
	})

}