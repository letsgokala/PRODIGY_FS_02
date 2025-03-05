import express from "express";
import pool from "../models/db.js";

const router = express.Router();

// Middleware to ensure authentication
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect("/auth/login");
}

// Employee: View leave requests
router.get("/", isAuthenticated, async (req, res) => {
    try {
        const leaveRequests = await pool.query(
            "SELECT * FROM leave_requests WHERE user_id = $1 ORDER BY created_at DESC",
            [req.session.user.id]
        );
        res.render("leave", { user: req.session.user, leaveRequests: leaveRequests.rows });
    } catch (err) {
        console.error("Error fetching leave requests:", err);
        res.status(500).send("Error fetching leave requests");
    }
});

// Employee: Submit a leave request
router.post("/", isAuthenticated, async (req, res) => {
    const { start_date, end_date, reason } = req.body;

    try {
        await pool.query(
            "INSERT INTO leave_requests (user_id, start_date, end_date, reason, status, created_at) VALUES ($1, $2, $3, $4, 'pending', NOW())",
            [req.session.user.id, start_date, end_date, reason]
        );
        res.redirect("/leave");
    } catch (err) {
        console.error("Error submitting leave request:", err);
        res.status(500).send("Error submitting leave request");
    }
});

// Manager: View all leave requests
router.get("/manage", isAuthenticated, async (req, res) => {
    if (req.session.user.role !== "manager") return res.status(403).send("Access denied");

    try {
        const leaveRequests = await pool.query(
            "SELECT lr.*, u.username FROM leave_requests lr JOIN users u ON lr.user_id = u.id ORDER BY lr.created_at DESC"
        );
        res.render("manage_leave", { user: req.session.user, leaveRequests: leaveRequests.rows });
    } catch (err) {
        console.error("Error fetching leave requests:", err);
        res.status(500).send("Error fetching leave requests");
    }
});

// Manager: Approve a leave request
router.post("/approve/:id", isAuthenticated, async (req, res) => {
    if (req.session.user.role !== "manager") return res.status(403).send("Access denied");

    try {
        await pool.query("UPDATE leave_requests SET status = 'approved' WHERE id = $1", [req.params.id]);
        res.redirect("/leave/manage");
    } catch (err) {
        console.error("Error approving leave request:", err);
        res.status(500).send("Error approving leave request");
    }
});

// Manager: Deny a leave request
router.post("/deny/:id", isAuthenticated, async (req, res) => {
    if (req.session.user.role !== "manager") return res.status(403).send("Access denied");

    try {
        await pool.query("UPDATE leave_requests SET status = 'denied' WHERE id = $1", [req.params.id]);
        res.redirect("/leave/manage");
    } catch (err) {
        console.error("Error denying leave request:", err);
        res.status(500).send("Error denying leave request");
    }
});

export default router;
