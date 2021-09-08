require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const DUPLICATE_ERROR_CODE = 11000;
// 2 hours in milliseconds
const COOKIE_MAX_AGE = 7200000;
const { PORT, JWT_SECRET, MONGODB_URL } = process.env;
const app = express();
const salt = 10;

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

mongoose.connect(MONGODB_URL, {useNewUrlParser: true, useUnifiedTopology: true});


const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { collection: "users" });
const User = mongoose.model("User", userSchema);

const verifyUserLogin = async (email, password) => {
    try {
        const user = await User.findOne({ email }).lean();
        if (!user) {
            return { status: "error", error: "User not found" };
        }
        if (await bcrypt.compare(password, user.password)) {
            // eslint-disable-next-line no-underscore-dangle
            const token = jwt.sign({ id: user._id, email: user.email, type: "user" }, JWT_SECRET, { expiresIn: "2h" });
            return { status: "ok", data: token };
        }
        return { status: "error", error: "Invalid password" };
    }
    catch (error) {
        console.log(error);
        return { status: "error", error: "Timed out" };
    }
};

const verifyToken = (token) => {
    try {
        const verify = jwt.verify(token, JWT_SECRET);
        return verify.type === "user";
    }
    catch (error) {
        console.log(JSON.stringify(error), "error");
        return false;
    }
};

app.post("/signup", async (req, res) => {
    const { email, password: plainTextpassword } = req.body;
    const password = await bcrypt.hash(plainTextpassword, salt);

    try {
        await User.create({ email, password });
        return res.redirect("/");
    }
    catch (error) {
        console.log(JSON.stringify(error));
        if (error.code === DUPLICATE_ERROR_CODE) {
            return res.send({ status: "error", error: "Email already exists" });
        }
        throw error;
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const response = await verifyUserLogin(email, password);
    if (response.status === "ok") {
        res.cookie("token", response.data, { maxAge: COOKIE_MAX_AGE, httpOnly: true });
        res.redirect("/");
    }
    else {
        res.json(response);
    }
});

app.get("/", (req, res) => {
    const { token } = req.cookies;
    if (verifyToken(token)) {
        res.render("home");
    }
    else {
        res.redirect("/login");
    }
});

app.get("/login", (req, res) => {
    res.render("signin");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});
