import { useRef } from 'react';

const SendIcon = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
		<path
			d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const AttachIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<path
			d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L9.42 17.4a1.5 1.5 0 0 1-2.12-2.12l8.49-8.49"
			stroke="currentColor"
			strokeWidth="1.7"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const EmojiIcon = () => (
	<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
		<circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
		<circle cx="6.6" cy="7.5" r="1" fill="currentColor" />
		<circle cx="11.4" cy="7.5" r="1" fill="currentColor" />
		<path
			d="M6 10.8c.7 1 1.8 1.6 3 1.6s2.3-.6 3-1.6"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
	</svg>
);

const Composer = ({ contact, value, onChange, onSend, onTyping }) => {
	const textareaRef = useRef(null);
	const canSend = value.trim().length > 0;

	const autoGrow = (el) => {
		el.style.height = 'auto';
		el.style.height = `${el.scrollHeight}px`;
	};

	const handleChange = (e) => {
		onChange(e.target.value);
		autoGrow(e.target);
		onTyping();
	};

	const handleKeyDown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (canSend) onSend();
		}
	};

	const handleSendClick = () => {
		onSend();
		if (textareaRef.current) textareaRef.current.style.height = 'auto';
	};

	return (
		<div className="rt-composer">
			<div className="rt-composer-row">
				{/* File attachments aren't supported by the backend yet - see
				    ISSUES.md Phase 5. Left as a visual placeholder. */}
				<button type="button" aria-label="Attach a file" className="rt-attach-btn" disabled>
					<AttachIcon />
				</button>
				<div className="rt-field">
					<textarea
						ref={textareaRef}
						rows={1}
						aria-label={`Message ${contact.first_name} ${contact.last_name}`}
						placeholder={`Message ${contact.first_name}`}
						value={value}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
					/>
					{/* Emoji picker isn't implemented yet - visual placeholder. */}
					<button type="button" aria-label="Add emoji" className="rt-emoji-btn" disabled>
						<EmojiIcon />
					</button>
				</div>
				<button
					type="button"
					aria-label="Send message"
					className="rt-send-btn"
					disabled={!canSend}
					onClick={handleSendClick}
				>
					<SendIcon />
				</button>
			</div>
		</div>
	);
};

export default Composer;
