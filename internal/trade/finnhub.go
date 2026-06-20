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

	//end connection
	defer resp.Body.Close()

	var result FinnhubResponse
	json.NewDecoder(resp.Body).Decode(&result)

	if result.CurrentPrice == 0 {
        return 0, fmt.Errorf("invalid ticker")
    }

    return result.CurrentPrice, nil
}




type SearchResponse struct {
    Count  int            `json:"count"`
    Result []SearchResult `json:"result"`
}

type SearchResult struct {
    Symbol      string `json:"symbol"`
    Description string `json:"description"`
    Type        string `json:"type"`
}


func SearchStock(w http.ResponseWriter, r *http.Request) {

	query := r.URL.Query().Get("q") // we use query here cuz you are not passing a req body but rather a query for the url
	if query == "" {
    http.Error(w, "Search query required", http.StatusBadRequest)
    return
	}

	key := os.Getenv("FINNHUB_API_KEY")
	url := fmt.Sprintf("https://finnhub.io/api/v1/search?q=%s&token=%s", query, key)

	resp, err := http.Get(url)
	if err != nil {
    http.Error(w, "Could not fetch results", http.StatusInternalServerError)
    return
	}

	// end connection
	defer resp.Body.Close()

	var searchResponse SearchResponse
	json.NewDecoder(resp.Body).Decode(&searchResponse)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode( searchResponse.Result)

}