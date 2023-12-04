const cors = require('cors');
const express = require("express");
const path = require("path");
const app = express();

require('dotenv').config();

const registerRouter = require('./routes/auth/register');
// const loginRouter = require('./routes/login');
// const chatRouter = require('./routes/chat');

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.static("chat/build"))
app.use(express.json());
app.use(registerRouter);


app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'chat','build', 'index.html'));
})

app.get('/', (req, res) => {
    return res.sendFile();
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))