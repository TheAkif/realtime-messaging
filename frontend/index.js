const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

require('dotenv').config();

const loginRoute = require('./routes/auth/login');
const logoutRoute = require('./routes/auth/logout');
const meRoute = require('./routes/auth/me');
const refreshRoute = require('./routes/auth/refresh');
const registerRoute = require('./routes/auth/register');
const verifyRoute = require('./routes/auth/verify');
const chatRoute = require('./routes/chat/chat')
const profileRoute = require('./routes/profile/profile')

const app = express();

// Trust the X-Forwarded-Proto header nginx sets, so req.secure reflects the
// scheme the browser actually used even though this app itself only ever
// speaks plain HTTP to nginx.
app.set('trust proxy', 1);

app.use(express.json());
app.use(cookieParser());

app.use(loginRoute);
app.use(logoutRoute);
app.use(meRoute);
app.use(refreshRoute);
app.use(registerRoute);
app.use(verifyRoute);
app.use(chatRoute)
app.use(profileRoute)

app.use(express.static('client/build'));
app.get('*', (req, res) => {
	return res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
