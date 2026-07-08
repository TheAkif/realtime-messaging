export const getInitialTheme = () => {
	const saved = localStorage.getItem('rt-theme');
	if (saved === 'light' || saved === 'dark') return saved;
	return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light';
};
