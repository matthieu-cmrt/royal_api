let express = require("express");
let app = express();
let port = 4242;
app.use(express.json());

app.get("/", (req, res) => {
res.status(200).json({ message: "Hello World!" });
console.log("GET /");
}
);

app.listen(port, () => {
console.log(`Server listening on port: ${port}`);
}
);

module.exports = app;