let express = require("express");
let app = express();
app.use(express.json());

app.get("/", (req, res) => {
res.status(200).json({ message: "Hello World!" });
}
);

app.get("/test", (req, res) => {
    res.redirect("https://www.google.com/search?channel=fs&client=ubuntu-sn&q=never+gonna+give+you+up");
    }
);

module.exports = app;