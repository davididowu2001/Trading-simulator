package trade

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type FinnhubResponse struct {
	CurrentPrice float64 `json:"c"`
}

func GetLivePrice(ticker string) (float64, error){
	key := os.Getenv("FINNHUB_API_KEY")
	url := fmt.Sprintf("https://finnhub.io/api/v1/quote?symbol=%s&token=%s", ticker, key)
	resp, err := http.Get(url)
	if err != nil {
        return 0, err
    }

	defer resp.Body.Close()

	var result FinnhubResponse
	json.NewDecoder(resp.Body).Decode(&result)

	if result.CurrentPrice == 0 {
        return 0, fmt.Errorf("invalid ticker")
    }

    return result.CurrentPrice, nil
}