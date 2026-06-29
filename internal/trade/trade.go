package trade

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/david/trading-simulator/internal/database"
	"github.com/david/trading-simulator/internal/models"
)

// import (
// 	"encoding/json"
// 	"net/http"
// 	"strings"

// 	"github.com/david/trading-simulator/internal/database"
// 	"github.com/david/trading-simulator/internal/models"
// 	"github.com/golang-jwt/jwt/v5"
// 	finnhub "github.com/Finnhub-Stock-API/finnhub-go/v2"
// )

type BuyRequest struct {
	Ticker string `json:"ticker"`
	Shares float64 `json:"shares"`
}

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

func BuyStock(w http.ResponseWriter, r *http.Request) {
	var req BuyRequest
	json.NewDecoder(r.Body).Decode(&req)

	username := r.Context().Value("username").(string)

	var user models.User
	err:= database.DB.Get(&user, "SELECT * FROM users WHERE username = $1", username)
	if err != nil{
		http.Error(w, "User doesnt exist", http.StatusBadRequest)
		return
	}	

	current_price, err := GetLivePrice(req.Ticker)
	if err != nil {
		http.Error(w, "Issue getting price", http.StatusInternalServerError)
		return
	}
	fmt.Println(req.Shares)
	total_cost := current_price * req.Shares

	fmt.Println("total_cost is:", total_cost)
	if user.Balance >= total_cost {
		tx,err :=  database.DB.Beginx()
		if err != nil {
    		http.Error(w, "something went wrong", http.StatusInternalServerError)
    		return
		}
		defer tx.Rollback()

		_, err = tx.Exec(
			"Update users SET Balance = Balance - $1 WHERE id = $2", total_cost, user.ID,
		)
		if err != nil {
			http.Error(w, "Balance not enough", http.StatusInternalServerError)
			return

		}
		_, err = tx.Exec (
			"INSERT INTO trades (user_id, shares, ticker, price, type, executed_at) VALUES ($1, $2, $3, $4, $5, $6)", user.ID, req.Shares,  req.Ticker,current_price, "BUY", time.Now(),
		)
		if err != nil {
			http.Error(w, "something went wrong with trade insertion", http.StatusInternalServerError)
			return

		}
		_, err = tx.Exec(`
			INSERT INTO positions (user_id, ticker, shares, average_price) 
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (user_id, ticker) 
			DO UPDATE SET 
				average_price = ((positions.shares * positions.average_price) + ($3 * $4)) / (positions.shares + $3),
				shares = positions.shares + $3`,
			user.ID, req.Ticker, req.Shares, current_price,
		)
		if err != nil {
			http.Error(w, "something went wrong with postion insertion", http.StatusInternalServerError)
			return

		}
		err = tx.Commit()
		if err != nil{
			http.Error(w, "something went wrong with commit", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message":"success"})
		return
	
	}
	
	http.Error(w, "Balance isn't sufficient", http.StatusBadRequest)
}

// Ticker     string    `db:"ticker"`
//     Shares     float64   `db:"shares"`
//     Price      float64   `db:"price"`
//     Type       string    `db:"type"`
//     ExecutedAt time.Time `db:"executed_at"`
// buy(shares, ticker)
// current_price = fetchliveprice(ticker)
// total_cost = current_price * shares
// if user.balance >=total_cost:
// 	user.balance = user.balance - total_cost
// 	trade.shares = shares
// 	trade.ticker = ticker
// 	trade.price = current_price
// 	trade.type= buy
// 	trade.executedAt = time.now

// 	#repeat for positions
// 	return 201 success
// else:
// 	return 400 error


// sell -- number of shares , ticker

type SellRequest struct {
	Ticker string `json:"ticker"`
	Shares float64 `json:"shares"`
}


func SellStock (w http.ResponseWriter, r *http.Request) {
	var req SellRequest
	json.NewDecoder(r.Body).Decode(&req)

	username := r.Context().Value("username").(string)

	var user models.User
	err := database.DB.Get(&user, "SELECT * FROM users WHERE username = $1", username)
	if err != nil{
		http.Error(w, "User doesnt exist", http.StatusBadRequest)
		return
	}	
	var position models.Position
	err = database.DB.Get(&position, "SELECT * FROM positions WHERE user_id = $1 AND ticker = $2", user.ID, req.Ticker)
	if err != nil {
		http.Error(w, "You don't own this stock", http.StatusBadRequest)
		return
	}

	if req.Shares > position.Shares {
		http.Error(w, "Not enough shares", http.StatusBadRequest)
		return
	}
	
	current_price,err := GetLivePrice(req.Ticker)
	if err != nil {
    http.Error(w, "Could not fetch price", http.StatusInternalServerError)
    return
	}
	sell_order := req.Shares * current_price

	//begin transaction

	tx,err :=  database.DB.Beginx()

	if err != nil {
    http.Error(w, "Server error", http.StatusInternalServerError)
    return
	}
	defer tx.Rollback()

		_, err = tx.Exec(
			"Update users SET Balance = Balance + $1 WHERE id = $2", sell_order, user.ID,
		)
		if err != nil {
			http.Error(w, "Server error", http.StatusInternalServerError)
			return

		}
		remainingShares := position.Shares - req.Shares

		if remainingShares == 0 {
			// delete the position
			_, err = tx.Exec("DELETE FROM positions WHERE user_id = $1 AND ticker = $2", user.ID, req.Ticker)
		} else {
			// update shares downward
			_, err = tx.Exec("UPDATE positions SET shares = $1 WHERE user_id = $2 AND ticker = $3", remainingShares, user.ID, req.Ticker)
		}
		if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
		}
		_, err = tx.Exec (
			"INSERT INTO trades (user_id, shares, ticker, price, type, executed_at) VALUES ($1, $2, $3, $4, $5, $6)", user.ID, req.Shares,  req.Ticker,current_price, "SELL", time.Now(),
		)
		if err != nil {
			http.Error(w, "something went wrong with trade insertion", http.StatusInternalServerError)
			return

		}
		err = tx.Commit()
		if err != nil {
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message":"success"})
}