import express from "express";
import session from "express-session";
import path from "path"; // Required for EJS file paths
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboard.js"; // FIXED TYPO
import profileRoutes from "./routes/profileRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import manageLeaveRoutes from "./routes/manageLeaveRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import statusRoutes from "./routes/statusRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";




const app = express();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
    session({
        secret: "@Khalid700",
        resave: false,
        saveUninitialized: true,
    })
);

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

// Routes
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/profile", profileRoutes);
app.use("/leave", leaveRoutes);
app.use("/manage-leave", manageLeaveRoutes);
app.use("/announcements", announcementRoutes);
app.use("/salary", salaryRoutes);
app.use("/status", statusRoutes);
app.use("/employees", employeeRoutes);
app.use("/profile", profileRoutes);

app.use(express.static("public"));
// Redirect root to login page
app.get("/", (req, res) => {
    res.redirect("/auth/login");
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
