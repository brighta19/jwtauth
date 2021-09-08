require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const DUPLICATE_ERROR_CODE = 11000;
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

app.get("/",(req, res)=>{
    res.render("home");
})

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});
