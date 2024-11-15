const express = require('express');
const routes = require('./routes/routes.js')
const { initBC, initDB } = require('./config/config.js')
const cors = require('cors');

const app = express();

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use((req, res, next) => {
    console.log(`Request received on ${req.path} - ${(new Date()).toLocaleString()}`),
        next();
})
app.use(routes)

const port = process.env.PORT || 3000;

initDB().then(() => {
    initBC().then(() => {
        console.log("Blockchain connected!")
    }).catch((err) => {
        console.log("🚀 ~ initBC ~ err:", err)
        console.log("Unable to reach blockchain env")
    })
    console.log("Database connected!")
    app.listen(port, () => { console.log(`Listening on ${port}`) })
});