const express = require("express");
const app = express();
app.use(express.json());
const PORT = 3000;

const pool = require('./initDB');
const dalBook = require('./dal/book')(pool);

const bookRoute = require('./routes/book')(dalBook);
const userRoute = require('./routes/user');

app.use('/api', bookRoute);
app.use('/api', userRoute);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
