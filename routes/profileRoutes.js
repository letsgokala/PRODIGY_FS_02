import express from "express";
import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import pool from "../models/db.js";

const router = express.Router();

// Middleware to ensure authentication
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect("/auth/login");
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// GET profile
router.get("/", isAuthenticated, async (req, res) => {
    try {
        const { user } = req.session;
        if (!user) return res.redirect("/auth/login");

        // Fetch employee details if available
        const employeeResult = await pool.query("SELECT * FROM employees WHERE user_id = $1", [user.id]);
        const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [user.id]);

        res.render("profile", { user, employee: employeeResult.rows[0] || null, current: userResult.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// POST update profile
router.post("/update", isAuthenticated, upload.single("picture"), async (req, res) => {
    try {
        const { user } = req.session;
        if (!user) return res.redirect("/auth/login");

        let { full_name, password, sex } = req.body;
        let picture = req.file ? req.file.filename : null;

        // Fetch existing data
        const employeeResult = await pool.query("SELECT * FROM employees WHERE user_id = $1", [user.id]);
        const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [user.id]);

        let oldData = employeeResult.rows[0] || {};
        let oldUserData = userResult.rows[0] || {};

        // Preserve old values
        full_name = full_name || oldData.full_name || oldUserData.username;
        sex = sex || oldData.sex;
        picture = picture || oldData.picture;
        password = password ? await bcrypt.hash(password, 10) : oldUserData.password;

        // Validate password length
        if (password && password.length < 4) {
            return res.status(400).render("profile", { 
                user, 
                employee: oldData, 
                current: oldUserData, 
                error: "Password must be at least 4 characters" 
            });
        }

        // Update employees table if user is an employee
        if (employeeResult.rows.length > 0) {
            await pool.query(
                "UPDATE employees SET full_name = $1, sex = $2, picture = $3 WHERE user_id = $4",
                [full_name, sex, picture, user.id]
            );
        }

        // Update users table
        await pool.query("UPDATE users SET username = $1, password = $2 WHERE id = $3", [full_name, password, user.id]);

        // Update session data
        req.session.user.username = full_name;
        if (picture) req.session.user.picture = picture;

        res.redirect("/profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating profile");
    }
});
export default router;
