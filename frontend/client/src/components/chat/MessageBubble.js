import Avatar from './Avatar';
import { formatClockTime } from 'utils/chatFormat';

const anchorRadius = (isOwn, isGroupEnd) => {
	const tight = 5;
	const loose = 8;
	const near = isGroupEnd ? tight : loose;
	return isOwn ? `16px 16px ${near}px 16px` : `16px 16px 16px ${near}px`;
};

// pending (still queued locally) -> sent (server has it) -> delivered
// (their device has it) -> read (they've seen it).
const statusFor = (message) => {
	if (message.pending) return 'pending';
	if (message.read) return 'read';
	if (message.delivered) return 'delivered';
	return 'sent';
};

const SignalStatus = ({ status }) => (
	<span className={`rt-signal is-${status}`} aria-hidden="true">
		<span />
		<span />
		<span />
	</span>
);

const MessageBubble = ({ item, contact, isLatestOwn }) => {
	const { message, isOwn, isGroupStart, isGroupEnd } = item;
	const status = isOwn ? statusFor(message) : null;
	const rowClasses = [
		'rt-message-row',
		isOwn ? 'is-own' : '',
		isGroupStart ? 'group-start' : '',
		isLatestOwn ? 'always-show-ts' : '',
	]
		.filter(Boolean)
		.join(' ');

	const label = isOwn
		? `You, ${formatClockTime(message.timestamp)}, ${status}`
		: `${contact.first_name}, ${formatClockTime(message.timestamp)}`;

	return (
		<div className={rowClasses} tabIndex={0} aria-label={label}>
			{isOwn ? (
				<>
					<span className="rt-message-ts">
						{formatClockTime(message.timestamp)}
						<SignalStatus status={status} />
					</span>
					<div
						className={`rt-bubble rt-bubble--sent${message.pending ? ' rt-bubble--sending' : ''}`}
						style={{ borderRadius: anchorRadius(true, isGroupEnd) }}
					>
						{message.content}
					</div>
				</>
			) : (
				<>
					<span className="rt-message-avatar-slot">
						{isGroupEnd && (
							<Avatar
								userId={contact.id}
								firstName={contact.first_name}
								lastName={contact.last_name}
								size="thread"
							/>
						)}
					</span>
					<div
						className="rt-bubble rt-bubble--received"
						style={{ borderRadius: anchorRadius(false, isGroupEnd) }}
					>
						{message.content}
					</div>
					<span className="rt-message-ts">{formatClockTime(message.timestamp)}</span>
				</>
			)}
		</div>
	);
};

export default MessageBubble;
