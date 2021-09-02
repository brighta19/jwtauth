require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { PORT } = process.env;
const app = express();
const salt = 10;

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));


app.get('/',(req,res)=>{
    res.render('home');
})

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});
