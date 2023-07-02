let express = require("express");
let app = express();
app.use(express.json());

app.get("/", (req, res) => {
res.status(200).json({ message: "Hello World!" });
}
);

app.get("/test", (req, res) => {
    res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    }
);

module.exports = app;