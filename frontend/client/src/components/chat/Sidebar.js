import { useRef, useState } from 'react';
import Avatar from './Avatar';
import ConversationRow from './ConversationRow';
import NoConversations from './NoConversations';
import ThemeToggle from './ThemeToggle';
import RabtWordmark from 'components/RabtWordmark';

const PlusIcon = () => (
	<svg className="rt-svg-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
		<path d="M12 5v14M5 12h14" />
	</svg>
);

const SearchIcon = () => (
	<svg className="rt-svg-icon" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
		<circle cx="11" cy="11" r="7" />
		<path d="m21 21-4.3-4.3" />
	</svg>
);

const Sidebar = ({
	conversations,
	activeChatUser,
	typingByContactId,
	presenceByContactId,
	onSelect,
	theme,
	onToggleTheme,
	currentUser,
	onLogout,
}) => {
	const [query, setQuery] = useState('');
	const searchInputRef = useRef(null);
	const searchInputId = 'rt-search-people';

	const focusSearch = () => searchInputRef.current?.focus();

	const filtered = conversations.filter((c) => {
		const name = `${c.first_name} ${c.last_name}`.toLowerCase();
		return name.includes(query.trim().toLowerCase());
	});

	return (
		<div className="rt-sidebar">
			<div className="rt-sidebar-header">
				<RabtWordmark />
				<span className="rt-sidebar-header-actions">
					<ThemeToggle theme={theme} onToggle={onToggleTheme} />
					<button
						type="button"
						aria-label="New message"
						className="rt-icon-btn rt-new-message-btn"
						onClick={focusSearch}
					>
						<PlusIcon />
					</button>
				</span>
			</div>
			<div className="rt-search-wrap">
				<label htmlFor={searchInputId} className="rt-visually-hidden">
					Search conversations
				</label>
				<span className="rt-search-icon" aria-hidden="true">
					<SearchIcon />
				</span>
				<input
					id={searchInputId}
					ref={searchInputRef}
					type="search"
					placeholder="Search people"
					className="rt-search-input"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</div>
			{conversations.length === 0 ? (
				<NoConversations onNewMessage={focusSearch} />
			) : (
				<nav aria-label="Conversations" className="rt-conversation-list">
					{filtered.map((conversation) => (
						<ConversationRow
							key={conversation.id}
							conversation={conversation}
							isActive={activeChatUser?.id === conversation.id}
							isTyping={!!typingByContactId?.[conversation.id]}
							isOnline={presenceByContactId?.[conversation.id] === 'online'}
							onSelect={onSelect}
						/>
					))}
				</nav>
			)}
			<div className="rt-sidebar-footer">
				<Avatar
					userId={currentUser.id}
					firstName={currentUser.first_name}
					lastName={currentUser.last_name}
					size="thread"
				/>
				<span className="rt-sidebar-footer-name">
					{currentUser.first_name} {currentUser.last_name}
				</span>
				<button type="button" className="rt-sidebar-footer-logout" onClick={onLogout}>
					Log out
				</button>
			</div>
		</div>
	);
};

export default Sidebar;
