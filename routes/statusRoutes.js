import express from "express";
import pool from "../models/db.js";

const router = express.Router();

// Ensure only managers can update status
function isManager(req, res, next) {
    if (req.session.user && req.session.user.role === "manager") {
        return next();
    }
    res.redirect("/dashboard");
}

// Update employee status
router.post("/update/:id", isManager, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await pool.query(
            "UPDATE employees SET status = $1 WHERE id = $2",
            [status, id]
        );
        res.redirect("/dashboard");
    } catch (err) {
        console.error("Status Update Error:", err);
        res.status(500).send("Error updating status");
    }
});

export default router;
