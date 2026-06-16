package auth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/david/trading-simulator/internal/database"
	"github.com/david/trading-simulator/internal/models"
	"github.com/golang-jwt/jwt/v5"

	"golang.org/x/crypto/bcrypt"
)


var jwtSecret = []byte("your-secret-key")

func Signup(w http.ResponseWriter, r *http.Request) {
    // 1. decode the request body
    var user models.User
    json.NewDecoder(r.Body).Decode(&user)

    // 2. validate
    if user.Username == "" || user.Email == "" || user.Password == "" {
        http.Error(w, "All fields required", http.StatusBadRequest)
        return
    }

    // 3. hash the password
    hashed, err := bcrypt.GenerateFromPassword([]byte(user.Password), 10)
    if err != nil {
        http.Error(w, "Server error", http.StatusInternalServerError)
        return
    }

    // 4. save to database
    _, err = database.DB.Exec(
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
        user.Username, user.Email, string(hashed),
    )
    if err != nil {
        http.Error(w, "Username or email already exists", http.StatusConflict)
        return
    }

    // 5. create JWT
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "username": user.Username,
        "exp":      time.Now().Add(time.Hour * 24).Unix(),
    })

    tokenString, err := token.SignedString(jwtSecret)
    if err != nil {
        http.Error(w, "Server error", http.StatusInternalServerError)
        return
    }
	
    // 6. return JWT
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]string{
        "token": tokenString,
    })
}

func Login(w http.ResponseWriter, r *http.Request){
	// decode the requestbody
	var user models.User
	json.NewDecoder(r.Body).Decode(&user)
	fmt.Printf("decoded user: %+v\n", user)

	// 2. validate
    if user.Username == "" || user.Password == "" {
        http.Error(w, "All fields required", http.StatusBadRequest)
        return
    }


	// save plain password before DB query overwrites it
	plainPassword := user.Password


	// then query database (this gets everything from DB, meaning that password gets overwritten bu call as well)
	err:= database.DB.Get(&user, "SELECT * FROM users WHERE username = $1", user.Username)
	if err != nil{
		http.Error(w, "User doesnt exist", http.StatusBadRequest)
		return
	}

	/// then compare if the hashedpassword // now user.Password is the hash, plainPassword is what they typed
	err = bcrypt.CompareHashAndPassword([]byte(user.Password),[]byte(plainPassword))
	fmt.Print(err)
	
	if err != nil {
    // Password incorrect
    http.Error(w, "Invalid credentials", http.StatusUnauthorized)
    return
	}
	 // 5. create JWT
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "username": user.Username,
        "exp":      time.Now().Add(time.Hour * 24).Unix(),
    })

    tokenString, err := token.SignedString(jwtSecret)
    if err != nil {
        http.Error(w, "Server error", http.StatusInternalServerError)
        return
    }
	
    // 6. return JWT
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "token": tokenString,
    })

}