const express = require('express');
const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

router.get('/api/users/all', async (req, res) => {
	const { access } = req.cookies;

	try {
		const apiRes = await fetch(`${process.env.API_URL}/api/users/users`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${access}`,
			},
		});

		const data = await apiRes.json();
		console.log(data)
		return res.status(apiRes.status).json(data);
	} catch (err) {
		return res.status(500).json({
			error: 'Something went wrong when trying to retrieve user',
		});
	}
});


router.get('/api/users/messages/:targetUserId', async (req, res) => {
    const { access } = req.cookies;
    const targetUserId = req.params.targetUserId; // Get the targetUserId from the URL

    try {
        const apiRes = await fetch(`${process.env.API_URL}/api/users/messages/${targetUserId}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${access}`,
            },
        });

        const data = await apiRes.json();
        return res.status(apiRes.status).json(data);
    } catch (err) {
        return res.status(500).json({
            error: 'Something went wrong when trying to retrieve user',
        });
    }
});


module.exports = router;
