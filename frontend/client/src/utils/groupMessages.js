import { dayLabelFor } from './chatFormat';

const sameDay = (a, b) => dayLabelFor(a) === dayLabelFor(b) && new Date(a).toDateString() === new Date(b).toDateString();

/**
 * Turns a flat, timestamp-ascending message list into day-divider + message
 * render items, with grouping metadata (consecutive-sender runs get a
 * shared avatar slot and an anchored bubble corner on the group's last
 * message, per the design spec).
 */
export const groupMessages = (messages, myUserId) => {
	const items = [];

	messages.forEach((message, index) => {
		const previous = messages[index - 1];
		const next = messages[index + 1];

		const isNewDay = !previous || !sameDay(previous.timestamp, message.timestamp);
		if (isNewDay) {
			items.push({ type: 'divider', key: `divider-${message.id}`, label: dayLabelFor(message.timestamp) });
		}

		const isOwn = message.sender === myUserId;
		const sameSenderAsPrev = previous && previous.sender === message.sender && !isNewDay;
		const sameSenderAsNext = next && next.sender === message.sender && sameDay(message.timestamp, next.timestamp);

		items.push({
			type: 'message',
			key: message.id,
			message,
			isOwn,
			isGroupStart: !sameSenderAsPrev,
			isGroupEnd: !sameSenderAsNext,
		});
	});

	return items;
};
