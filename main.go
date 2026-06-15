package main

import "github.com/david/trading-simulator/internal/database"



func main() {
    database.Connect()
    database.CreateTables()
}