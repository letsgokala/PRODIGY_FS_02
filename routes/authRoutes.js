import express from "express";
import bcrypt from "bcryptjs";
import pool from "../models/db.js";

const router = express.Router();

// Serve Register Page
router.get("/register", (req, res) => {
    res.render("register", { error: null });
});

// Serve Login Page
router.get("/login", (req, res) => {
    res.render("login", { error: null });
});

// Register a new user
router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  try {
      // Check if the username already exists
      const userCheck = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
      if (userCheck.rows.length > 0) {
          return res.render("register", { error: "Username already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      if(password.length < 4){
        return res.render("login", {error: "password must be at least 4 characters"});
      }

      // Insert new user
      const newUser = await pool.query(
          "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id",
          [username, hashedPassword, role]
      );

      const userId = newUser.rows[0].id;

      // If the user is an employee, insert into employees table
      if (role === "employee") {
          await pool.query(
              "INSERT INTO employees (user_id, full_name, sex, picture, position, department, date_hired) VALUES ($1, '', 'Male', '', '', '', CURRENT_DATE)",
              [userId]
          );
      }

      res.redirect("/auth/login");
  } catch (err) {
      console.error("Registration Error:", err);
      res.render("register", { error: "Error registering user" });
  }
});


// Login user
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render("login", { error: "All fields are required" });
    }

    try {
        const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

        if (user.rows.length === 0) {
            return res.render("login", { error: "Invalid username" });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.render("login", { error: "Invalid password" });
        }

        req.session.user = {
            id: user.rows[0].id,
            username: user.rows[0].username,
            role: user.rows[0].role,
        };

        res.redirect("/dashboard");
    } catch (err) {
        console.error("Login Error:", err);
        res.render("login", { error: "Error logging in" });
    }
});

// Logout user
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/auth/login"); // FIXED ROUTE
    });
});

export default router;
