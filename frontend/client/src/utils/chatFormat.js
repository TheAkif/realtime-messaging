export const initialsFor = (firstName, lastName) => {
	const first = (firstName || '').trim();
	const last = (lastName || '').trim();
	if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
	if (first) return first.slice(0, 2).toUpperCase();
	return '?';
};

export const tintFor = (userId) => {
	const n = Number(userId) || 0;
	return String(n % 4);
};

export const formatClockTime = (isoString) => {
	const date = new Date(isoString);
	return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const isSameDay = (a, b) =>
	a.getFullYear() === b.getFullYear() &&
	a.getMonth() === b.getMonth() &&
	a.getDate() === b.getDate();

export const dayLabelFor = (isoString) => {
	const date = new Date(isoString);
	const today = new Date();
	const yesterday = new Date();
	yesterday.setDate(today.getDate() - 1);

	if (isSameDay(date, today)) return 'Today';
	if (isSameDay(date, yesterday)) return 'Yesterday';
	return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const conversationTimeFor = (isoString) => {
	const date = new Date(isoString);
	const today = new Date();
	const yesterday = new Date();
	yesterday.setDate(today.getDate() - 1);

	if (isSameDay(date, today)) {
		return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	}
	if (isSameDay(date, yesterday)) return 'Yesterday';

	const daysAgo = Math.floor((today - date) / (1000 * 60 * 60 * 24));
	if (daysAgo < 7) return date.toLocaleDateString([], { weekday: 'short' });
	return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};
