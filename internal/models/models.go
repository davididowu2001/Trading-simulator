package models

import "time"

type User struct {
	ID		int		`db:"id"`
	Username 		int		`db:"username"`
	Email     string    `db:"email"`
    Password  string    `db:"password"`
    Balance   float64   `db:"balance"`
    CreatedAt time.Time `db:"created_at"`
}

type Position struct {
    ID           int     `db:"id"`
    UserID       int     `db:"user_id"`
    Ticker       string  `db:"ticker"`
    Shares       float64 `db:"shares"`
    AveragePrice float64 `db:"average_price"`
}

type Trade struct {
    ID         int       `db:"id"`
    UserID     int       `db:"user_id"`
    Ticker     string    `db:"ticker"`
    Shares     float64   `db:"shares"`
    Price      float64   `db:"price"`
    Type       string    `db:"type"`
    ExecutedAt time.Time `db:"executed_at"`
}