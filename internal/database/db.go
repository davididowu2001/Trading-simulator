package database

import (
	"fmt"
	"log"
	"os"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

var DB *sqlx.DB

func Connect(){
    connStr := os.Getenv("DATABASE_URL")
    // 2. If it's empty,
	if connStr == "" {
		connStr = "host=localhost user=postgres password=secret dbname=trading_app sslmode=disable"
		fmt.Println("Connecting to LOCAL database...")
	} else {
		fmt.Println("Connecting to RAILWAY production database...")
	}
	
	db, err := sqlx.Connect("postgres", connStr)
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    DB = db
    fmt.Println("Database connected successfully")
}

func CreateTables(){
	schema := `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        balance DECIMAL(10,2) DEFAULT 10000.00,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        ticker VARCHAR(10) NOT NULL,
        shares DECIMAL(10,4) NOT NULL,
        average_price DECIMAL(10,2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        ticker VARCHAR(10) NOT NULL,
        shares DECIMAL(10,4) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        type VARCHAR(4) NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
    );`

    DB.MustExec(schema)
    fmt.Println("Tables created successfully")
}
