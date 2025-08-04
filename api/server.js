//npmmel letöltve
const express = require("express")
const path = require("path");
const serverless = require("serverless-http");

const app = express()

// Közös middleware-ek és beállítások
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('../public'))
app.use("/css",express.static(path.join(__dirname, '../public/css')))
app.use("/js",express.static(path.join(__dirname, '../public/js')))
app.use("/music",express.static(path.join(__dirname, '../public/music')))
app.use("/pictures",express.static(path.join(__dirname, '../public/pictures')))
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs')

app.get("/*", (req, res)=>{
    ////werewrwerw
    res.render("index.ejs")
})

// For local development
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

// For Vercel serverless deployment
module.exports = serverless(app);