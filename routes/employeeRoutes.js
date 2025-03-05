import express from "express";
import pool from "../models/db.js";

const router = express.Router();

// Middleware to check if user is a manager
function isManager(req, res, next) {
    if (req.session.user && req.session.user.role === "manager") {
        return next();
    }
    res.status(403).send("Access Denied");
}

// Get all employees
router.get("/", async (req, res) => {
    try {
        const employees = await pool.query("SELECT * FROM employees");
        res.json(employees.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Add Employee
router.post("/add", isManager, async (req, res) => {
    const { full_name, sex, position, department, salary } = req.body;
    try {
        const newUsername = full_name.toLowerCase().replace(/\s+/g, "_");

        // Insert into users table first
        const userResult = await pool.query(
            "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id",
            [newUsername, '0000', "employee"]
        );

        const userId = userResult.rows[0].id;

        // Insert into employees table
        await pool.query(
            "INSERT INTO employees (user_id, full_name, sex, position, department, salary, date_hired) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)",
            [userId, full_name, 'Male', position, department, salary]
        );

        res.redirect("/dashboard");
    } catch (err) {
        console.error("Add Employee Error:", err);
        res.status(500).send("Error adding employee");
    }
});

// Edit Employee Page
router.get("/edit/:id", isManager, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM employees WHERE id = $1", [id]);
        res.render("editEmployee", { employee: result.rows[0] });
    } catch (err) {
        console.error("Fetch Employee Error:", err);
        res.status(500).send("Error fetching employee");
    }
});

// Update Employee
router.post("/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, sex, position, department, date_hired, picture } = req.body;

        // Get the user_id for this employee
        const employee = await pool.query("SELECT user_id FROM employees WHERE id = $1", [id]);
        if (employee.rows.length === 0) {
            return res.status(404).send("Employee not found");
        }

        const user_id = employee.rows[0].user_id;
        const newUsername = full_name.toLowerCase().replace(/\s+/g, "_");

        // Update employees and users tables
        await pool.query(
            "UPDATE employees SET full_name = $1, sex = $2, position = $3, department = $4, date_hired = CURRENT_DATE, picture = $5 WHERE id = $6", 
            [full_name, sex, position, department, picture, id]
        );

        await pool.query("UPDATE users SET username = $1 WHERE id = $2", [newUsername, user_id]);

        res.redirect("/dashboard");
    } catch (err) {
        console.error("Update Employee Error:", err);
        res.status(500).send("Server error");
    }
});

// Delete Employee
router.get("/delete/:id", isManager, async (req, res) => {
    const { id } = req.params;
    try {
        // Get user_id before deleting employee
        const employee = await pool.query("SELECT user_id FROM employees WHERE id = $1", [id]);
        if (employee.rows.length === 0) {
            return res.status(404).send("Employee not found");
        }

        const user_id = employee.rows[0].user_id;

        // Delete employee record
        await pool.query("DELETE FROM employees WHERE id = $1", [id]);

        // Delete associated user record
        await pool.query("DELETE FROM users WHERE id = $1", [user_id]);

        res.redirect("/dashboard");
    } catch (err) {
        console.error("Delete Employee Error:", err);
        res.status(500).send("Error deleting employee");
    }
});

// Update Employee Status
router.post("/status/update/:id", isManager, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query("UPDATE employees SET status = $1 WHERE id = $2", [status, id]);
        res.redirect("/dashboard");
    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).send("Server error");
    }
});

// Employee Profile Update (for employees updating their own profile)
router.post("/profile/update", async (req, res) => {
    if (!req.session.user) {
        return res.status(403).send("Unauthorized");
    }

    try {
        const userId = req.session.user.id;
        const { full_name, sex, position, department, picture } = req.body;
        const newUsername = full_name.toLowerCase().replace(/\s+/g, "_");

        // Update employees table
        await pool.query(
            "UPDATE employees SET full_name = $1, sex = $2, position = $3, department = $4, picture = $5 WHERE user_id = $6",
            [full_name, sex, position, department, picture, userId]
        );

        // Update users table
        await pool.query("UPDATE users SET username = $1 WHERE id = $2", [newUsername, userId]);

        req.session.user.username = newUsername; // Update session username
        res.redirect("/dashboard");
    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).send("Error updating profile");
    }
});

export default router;
