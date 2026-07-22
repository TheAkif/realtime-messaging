const express = require('express');
const multer = require('multer');
const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
});

router.patch('/api/users/profile', async (req, res) => {
	const { access } = req.cookies;

	try {
		const apiRes = await fetch(`${process.env.API_URL}/api/users/profile`, {
			method: 'PATCH',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Bearer ${access}`,
			},
			body: JSON.stringify(req.body),
		});

		const data = await apiRes.json();
		return res.status(apiRes.status).json(data);
	} catch (err) {
		return res.status(500).json({
			error: 'Something went wrong when saving your profile',
		});
	}
});

router.put('/api/users/avatar', upload.single('avatar'), async (req, res) => {
	const { access } = req.cookies;

	if (!req.file) {
		return res.status(400).json({ error: 'No image file provided' });
	}

	try {
		// The Web FormData/Blob API and fetch are both global in this Node
		// runtime - used directly here (not the node-fetch wrapper above)
		// since node-fetch doesn't reliably forward a multipart body built
		// from the native FormData implementation.
		const form = new FormData();
		form.append(
			'avatar',
			new Blob([req.file.buffer], { type: req.file.mimetype }),
			req.file.originalname
		);

		const apiRes = await globalThis.fetch(`${process.env.API_URL}/api/users/avatar`, {
			method: 'PUT',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${access}`,
			},
			body: form,
		});

		const data = await apiRes.json();
		return res.status(apiRes.status).json(data);
	} catch (err) {
		return res.status(500).json({
			error: 'Something went wrong when uploading your avatar',
		});
	}
});

module.exports = router;
