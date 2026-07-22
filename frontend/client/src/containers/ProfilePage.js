import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { updateProfile, uploadAvatar, clearError } from 'features/user';
import Avatar from 'components/chat/Avatar';
import 'styles/tokens.css';
import 'styles/chat.css';

const BackIcon = () => (
	<svg className="rt-svg-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
		<path d="m15 18-6-6 6-6" />
	</svg>
);

const BIO_MAX_LENGTH = 160;

const ProfilePage = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { isAuthenticated, authChecked, user, loading, error } = useSelector(state => state.user);
	const fileInputRef = useRef(null);

	useEffect(() => {
		dispatch(clearError());
	}, []);

	const [formData, setFormData] = useState({
		first_name: '',
		last_name: '',
		bio: '',
		phone_number: '',
	});
	const [saved, setSaved] = useState(false);

	// The page can be reached via a fresh page load (checkAuth/getUser still
	// in flight), so the form has to sync once the user actually arrives -
	// keyed on id, not the whole object, so a post-save re-merge of `user`
	// doesn't stomp on an in-progress edit.
	useEffect(() => {
		if (!user) return;
		setFormData({
			first_name: user.first_name || '',
			last_name: user.last_name || '',
			bio: user.bio || '',
			phone_number: user.phone_number || '',
		});
	}, [user?.id]);

	if (!isAuthenticated && authChecked) return <Navigate to="/login" />;
	if (!user) return null;

	const { first_name, last_name, bio, phone_number } = formData;

	const onChange = e => {
		setSaved(false);
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const onSubmit = e => {
		e.preventDefault();
		dispatch(updateProfile(formData)).then(result => {
			if (updateProfile.fulfilled.match(result)) setSaved(true);
		});
	};

	const onAvatarChange = e => {
		const file = e.target.files?.[0];
		if (file) dispatch(uploadAvatar(file));
		e.target.value = '';
	};

	return (
		<>
			<Helmet>
				<title>Rabt | Profile</title>
				<meta name="description" content="Edit your profile" />
			</Helmet>
			<div className="rt-app">
				<div className="rt-settings-page">
					<div className="rt-settings-header">
						<button
							type="button"
							aria-label="Back to chat"
							className="rt-settings-back-btn"
							onClick={() => navigate('/chat')}
						>
							<BackIcon />
						</button>
						<h1 className="rt-settings-title">Profile</h1>
					</div>

					<div className="rt-settings-body">
						<div className="rt-profile-avatar-section">
							<Avatar
								userId={user.id}
								firstName={user.first_name}
								lastName={user.last_name}
								photoUrl={user.avatar}
								size="header"
							/>
							<button
								type="button"
								className="rt-settings-link-btn"
								onClick={() => fileInputRef.current?.click()}
								disabled={loading}
							>
								Change photo
							</button>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								className="rt-visually-hidden"
								onChange={onAvatarChange}
							/>
						</div>

						<form onSubmit={onSubmit} className="rt-form">
							<div className="rt-form-row">
								<label className="rt-form-field" htmlFor="profile-first-name">
									<span className="rt-form-label">First name</span>
									<input
										id="profile-first-name"
										className="rt-form-input"
										type="text"
										name="first_name"
										value={first_name}
										onChange={onChange}
										disabled={loading}
										required
									/>
								</label>
								<label className="rt-form-field" htmlFor="profile-last-name">
									<span className="rt-form-label">Last name</span>
									<input
										id="profile-last-name"
										className="rt-form-input"
										type="text"
										name="last_name"
										value={last_name}
										onChange={onChange}
										disabled={loading}
										required
									/>
								</label>
							</div>

							<label className="rt-form-field" htmlFor="profile-bio">
								<span className="rt-form-label">Bio</span>
								<input
									id="profile-bio"
									className="rt-form-input"
									type="text"
									name="bio"
									maxLength={BIO_MAX_LENGTH}
									placeholder="Add a short status"
									value={bio}
									onChange={onChange}
									disabled={loading}
								/>
							</label>

							<label className="rt-form-field" htmlFor="profile-phone">
								<span className="rt-form-label">Phone number</span>
								<input
									id="profile-phone"
									className="rt-form-input"
									type="tel"
									name="phone_number"
									placeholder="Optional"
									value={phone_number}
									onChange={onChange}
									disabled={loading}
								/>
							</label>

							{error && (
								<p className="rt-form-error" role="alert">
									{error}
								</p>
							)}

							<div className="rt-form-actions">
								{saved && !loading && <span className="rt-form-saved">Saved</span>}
								<button type="submit" className="rt-form-submit" disabled={loading}>
									{loading ? 'Saving…' : 'Save changes'}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</>
	);
};

export default ProfilePage;
