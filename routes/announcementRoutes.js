import express from "express";
import pool from "../models/db.js";

const router = express.Router();

// Middleware to check if user is a manager
function isManager(req, res, next) {
    if (req.session.user && req.session.user.role === "manager") {
        return next();
    }
    res.redirect("/dashboard");
}

// GET announcements page
router.get("/", isManager, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM announcements ORDER BY created_at DESC");
        res.render("announcements", { announcements: result.rows });
    } catch (err) {
        console.error("Error fetching announcements:", err);
        res.status(500).send("Error loading announcements");
    }
});

// POST new announcement
router.post("/", isManager, async (req, res) => {
    try {
        const { message } = req.body;
        await pool.query("INSERT INTO announcements (message, created_at) VALUES ($1, NOW())", [message]);
        res.redirect("/announcements");
    } catch (err) {
        console.error("Error posting announcement:", err);
        res.status(500).send("Error posting announcement");
    }
});

// DELETE an announcement
router.post("/delete/:id", isManager, async (req, res) => {
    try {
        await pool.query("DELETE FROM announcements WHERE id = $1", [req.params.id]);
        res.redirect("/announcements");
    } catch (err) {
        console.error("Error deleting announcement:", err);
        res.status(500).send("Error deleting announcement");
    }
});

export default router;
