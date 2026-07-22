import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChevronIcon = () => (
	<svg className="rt-svg-icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
		<path d="m6 9 6 6 6-6" />
	</svg>
);

const AccountMenu = ({ onLogout, children }) => {
	const [open, setOpen] = useState(false);
	const wrapRef = useRef(null);
	const navigate = useNavigate();

	useEffect(() => {
		if (!open) return;
		const onOutsideClick = (e) => {
			if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
		};
		const onEscape = (e) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('mousedown', onOutsideClick);
		document.addEventListener('keydown', onEscape);
		return () => {
			document.removeEventListener('mousedown', onOutsideClick);
			document.removeEventListener('keydown', onEscape);
		};
	}, [open]);

	return (
		<div className="rt-account-menu" ref={wrapRef}>
			<button
				type="button"
				className="rt-account-menu-trigger"
				aria-haspopup="true"
				aria-expanded={open}
				onClick={() => setOpen((v) => !v)}
			>
				{children}
				<ChevronIcon />
			</button>
			{open && (
				<div className="rt-account-menu-panel" role="menu">
					<button
						type="button"
						role="menuitem"
						className="rt-account-menu-item"
						onClick={() => {
							setOpen(false);
							navigate('/profile');
						}}
					>
						Profile
					</button>
					<button
						type="button"
						role="menuitem"
						className="rt-account-menu-item"
						onClick={() => {
							setOpen(false);
							onLogout();
						}}
					>
						Log out
					</button>
				</div>
			)}
		</div>
	);
};

export default AccountMenu;
