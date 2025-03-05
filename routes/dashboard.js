import express from "express";
import pool from "../models/db.js";
const router = express.Router();

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect("/auth/login");
}

// Dashboard route
router.get("/", isAuthenticated, async (req, res) => {
    try {
        // Fetch announcements for all users
        const announcements = await pool.query("SELECT * FROM announcements ORDER BY created_at DESC");

        if (req.session.user.role === "manager") {
            // If user is a manager, fetch employees and leave requests
            const employees = await pool.query("SELECT * FROM employees");
            const leaveRequests = await pool.query("SELECT * FROM leave_requests WHERE status = 'pending'");

            res.render("dashboard", {
                user: req.session.user,
                announcements: announcements.rows,
                employees: employees.rows,
                leaveRequests: leaveRequests.rows,
            });
        } else {
            // If user is an employee, only show announcements
            res.render("dashboard", {
                user: req.session.user,
                announcements: announcements.rows,
            });
        }
    } catch (err) {
        console.error("Dashboard Error:", err);
        res.status(500).send("Error loading dashboard");
    }
});

export default router;
