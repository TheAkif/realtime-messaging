import { initialsFor, tintFor } from 'utils/chatFormat';

const Avatar = ({ userId, firstName, lastName, size = 'list', presence = null }) => (
	<span className={`rt-avatar-wrap${size === 'header' ? ' rt-avatar-wrap--header' : ''}`}>
		<span
			className={`rt-avatar rt-avatar--${size}`}
			data-tint={tintFor(userId)}
		>
			{initialsFor(firstName, lastName)}
		</span>
		{presence && <span className="rt-presence-indicator" aria-hidden="true" />}
	</span>
);

export default Avatar;
