const ThemeToggle = ({ theme, onToggle }) => (
	<button
		type="button"
		aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
		className="rt-icon-btn rt-theme-toggle"
		onClick={onToggle}
	>
		{theme === 'dark' ? '☀' : '☾'}
	</button>
);

export default ThemeToggle;
