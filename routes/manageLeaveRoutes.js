import express from "express";
import pool from "../models/db.js";

const router = express.Router();

// Middleware to check if the user is a manager
function isManager(req, res, next) {
    if (req.session.user && req.session.user.role === "manager") {
        return next();
    }
    res.redirect("/dashboard");
}

// GET route to display leave requests
router.get("/", isManager, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT leave_requests.*, employees.full_name 
            FROM leave_requests
            JOIN employees ON leave_requests.user_id = employees.user_id
            ORDER BY leave_requests.created_at DESC
        `);

        res.render("manageLeave", { leaveRequests: result.rows });
    } catch (err) {
        console.error("Manage Leave Error:", err);
        res.status(500).send("Error loading leave requests");
    }
});

// POST route to approve a leave request
router.post("/approve", isManager, async (req, res) => {
    try {
        await pool.query("UPDATE leave_requests SET status = 'approved' WHERE id = $1", [req.body.leave_id]);
        res.redirect("/manage-leave");
    } catch (err) {
        console.error("Approve Leave Error:", err);
        res.status(500).send("Error approving leave request");
    }
});

// POST route to deny a leave request
router.post("/deny", isManager, async (req, res) => {
    try {
        await pool.query("UPDATE leave_requests SET status = 'denied' WHERE id = $1", [req.body.leave_id]);
        res.redirect("/manage-leave");
    } catch (err) {
        console.error("Deny Leave Error:", err);
        res.status(500).send("Error denying leave request");
    }
});

export default router;
