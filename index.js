const express = require('express');
const routes = require('./routes/routes')
const cors = require('cors')
const db = require('./config/db')

const app = express();

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(routes)

const port = process.env.PORT || 3000;

db().then(() => {
    console.log("DB connected");
    app.listen(port, () => {
        console.log(`Listening on ${port}`);
    })
})