import { initialsFor, tintFor } from 'utils/chatFormat';

const Avatar = ({ userId, firstName, lastName, size = 'list', presence = null, photoUrl = null }) => (
	<span className={`rt-avatar-wrap${size === 'header' ? ' rt-avatar-wrap--header' : ''}`}>
		{photoUrl ? (
			<img
				src={photoUrl}
				alt=""
				className={`rt-avatar rt-avatar--${size} rt-avatar--photo`}
			/>
		) : (
			<span
				className={`rt-avatar rt-avatar--${size}`}
				data-tint={tintFor(userId)}
			>
				{initialsFor(firstName, lastName)}
			</span>
		)}
		{presence && <span className="rt-presence-indicator" aria-hidden="true" />}
	</span>
);

export default Avatar;
