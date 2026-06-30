package trade

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // allow all connections for now
	},
}

func LivePrices(w http.ResponseWriter, r *http.Request) {
	// 1. Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade error:", err)
		return
	}
	defer conn.Close()

	// 2. Read the very first message to know WHICH stock the user wants to watch
	_, msg, err := conn.ReadMessage()
	if err != nil {
		log.Println("read error:", err)
		return
	}
	tickerName := string(msg)
	log.Printf("Fetching price for ticker: '%s'\n", tickerName)

	log.Printf("User subscribed to live stream for: %s\n", tickerName)

	// 3. Set up a timer to push data every 1 second
	streamTimer := time.NewTicker(10 * time.Second)
	defer streamTimer.Stop()

	// 4. Continuous stream loop
	for range streamTimer.C {
		// Fetch the latest simulated or real price
		price, err := GetLivePrice(tickerName)
		if err != nil {
			log.Println("error getting price:", err)
			continue
		}

		// Capture current timestamp for your graph's X-Axis
		currentTime := time.Now().Format("15:04:05")

		// Push JSON back to the React Recharts frontend
		err = conn.WriteJSON(map[string]any{
			"ticker":    tickerName,
			"price":     price,
			"timestamp": currentTime,
		})
		
		if err != nil {
			log.Println("write error:", err)
			return // Client probably disconnected, exit the loop cleanly
		}
	}
}