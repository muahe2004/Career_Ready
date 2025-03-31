const express = require("express");
const app = express();
app.use(express.json());
const PORT = 3000;

const router = require('./route');

// app.get("/", (req, res) => {
//     res.send("API by Ly Van Minh");
// });

app.use('/api', router);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

