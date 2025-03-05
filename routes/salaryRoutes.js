import express from "express";
import pool from "../models/db.js";

const router = express.Router();

// Ensure only managers can update salaries
function isManager(req, res, next) {
    if (req.session.user && req.session.user.role === "manager") {
        return next();
    }
    res.redirect("/dashboard");
}

// Update salary
router.post("/update/:id", isManager, async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    try {
        await pool.query(
            "UPDATE employees SET salary = $1 WHERE id = $2",
            [amount, id]
        );
        res.redirect("/dashboard");
    } catch (err) {
        console.error("Salary Update Error:", err);
        res.status(500).send("Error updating salary");
    }
});

export default router;
