const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const router = express.Router();

router.post('/api/users/register', async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    try {
        const registerResponse = await fetch(`${process.env.API_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ first_name, last_name, email, password })
        });

        const data = await registerResponse.json();

        if (registerResponse.status === 201) {
            res.status(registerResponse.status).json(data);
        }

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;