const express = require("express");
const path = require("path");
const app = express();

app.use(express.static("chat/build"))

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'chat','build', 'index.html'));
})

app.get('/', (req, res) => {
    return res.sendFile();
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))