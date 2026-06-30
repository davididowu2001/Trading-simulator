package trade

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"
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

type AlphaVantageResponse struct {
    TimeSeries map[string]map[string]string `json:"Time Series (Daily)"`
}

type DataPoint struct {
    Date  string  `json:"date"`
    Close float64 `json:"close"`
}

func GetStockHistory(w http.ResponseWriter, r *http.Request) {
    ticker := r.URL.Query().Get("ticker")
    if ticker == "" {
        http.Error(w, "Ticker is required", http.StatusBadRequest)
        return
    }

    rangeParam := r.URL.Query().Get("range")
    if rangeParam == "" {
        http.Error(w, "Date range is required", http.StatusBadRequest)
        return
    }

    var fromTime time.Time
    switch rangeParam {
    case "1D":
        fromTime = time.Now().AddDate(0, 0, -1)
    case "3M":
        fromTime = time.Now().AddDate(0, -3, 0)
    case "ALL":
        fromTime = time.Now().AddDate(-10, 0, 0)
    default:
        http.Error(w, "Invalid range", http.StatusBadRequest)
        return
    }

    key := os.Getenv("ALPHA_VANTAGE_KEY")
    url := fmt.Sprintf("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=%s&outputsize=compact&apikey=%s", ticker, key)

    resp, err := http.Get(url)
    if err != nil {
        http.Error(w, "Could not fetch results", http.StatusInternalServerError)
        return
    }
    defer resp.Body.Close()

	// body, _ := io.ReadAll(resp.Body)
	// fmt.Println(string(body))

    var avResponse AlphaVantageResponse
    json.NewDecoder(resp.Body).Decode(&avResponse)

    var dataPoints []DataPoint
    for date, values := range avResponse.TimeSeries {
        parsedDate, _ := time.Parse("2006-01-02", date)
        if parsedDate.After(fromTime) {
            closePrice, _ := strconv.ParseFloat(values["4. close"], 64)
            dataPoints = append(dataPoints, DataPoint{
                Date:  date,
                Close: closePrice,
            })
        }
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(dataPoints)
}

type NewsItem struct {
    Category string `json:"category"`
    Datetime int64  `json:"datetime"`
    Headline string `json:"headline"`
    Image    string `json:"image"`
    Source   string `json:"source"`
    Summary  string `json:"summary"`
    URL      string `json:"url"`
}

func GetALLNewsFeed(w http.ResponseWriter, r *http.Request) {
	ticker := r.URL.Query().Get("ticker")
	daterange := r.URL.Query().Get("dates")

	key := os.Getenv("FINNHUB_API_KEY")
	var url string

	if ticker == "" {
		// general market news
		url = fmt.Sprintf("https://finnhub.io/api/v1/news?category=general&token=%s", key)
	} else {
		// company specific news
		if daterange == "" {
			http.Error(w, "Date range required for company news", http.StatusBadRequest)
			return
		}

		now := time.Now().Format("2006-01-02")
		var from string

		switch daterange {
		case "1D":
			from = time.Now().AddDate(0, 0, -1).Format("2006-01-02")
		case "3M":
			from = time.Now().AddDate(0, -3, 0).Format("2006-01-02")
		case "ALL":
			from = time.Now().AddDate(-10, 0, 0).Format("2006-01-02")
		default:
			http.Error(w, "Invalid range", http.StatusBadRequest)
			return
		}

		url = fmt.Sprintf("https://finnhub.io/api/v1/company-news?symbol=%s&from=%s&to=%s&token=%s", ticker, from, now, key)
	}

	resp, err := http.Get(url)
	if err != nil {
		http.Error(w, "Could not fetch results", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var news []NewsItem
	json.NewDecoder(resp.Body).Decode(&news)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(news)
}