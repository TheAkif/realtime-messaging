import { useState } from "react";
import Layout from "components/Layout";
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from "react-router-dom";
import { register } from 'features/user'

const RegisterPage = () => {
    const dispatch = useDispatch();
    const { registered, loading } = useSelector(state => state.user);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: ''
    });

    const { first_name, last_name, email, password } = formData

    const onChange = e => { setFormData({ ...formData, [e.target.name]: e.target.value }) }

    const onSubmit = e => {
        e.preventDefault();
        dispatch(register({ first_name, last_name, email, password }));
        console.log(formData)
    }

    if (registered)
        return <Navigate to="/login" />
    return (
        <Layout title='Real-time Chat | Register' content='Register page.'>
            <h1>Register yourself!</h1>
            <form className="mt-5" onSubmit={onSubmit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="first_name">
                        First Name:
                    </label>
                    <input className="form-control" type="text" name="first_name" value={first_name} onChange={onChange} required />
                </div>
                <div className="form-group mt-3">
                    <label className="form-label" htmlFor="last_name">
                        Last Name:
                    </label>
                    <input className="form-control" type="text" name="last_name" value={last_name} onChange={onChange} required />
                </div>
                <div className="form-group mt-3">
                    <label className="form-label" htmlFor="email">
                        Email:
                    </label>
                    <input className="form-control" type="email" name="email" value={email} onChange={onChange} required />
                </div>
                <div className="form-group mt-3">
                    <label className="form-label" htmlFor="password">
                        Password:
                    </label>
                    <input className="form-control" type="password" name="password" value={password} onChange={onChange} required />
                </div>
                {loading ? (
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                ) : (
                    <button className="btn btn-primary mt-3" type="submit">
                        Register
                    </button>
                )}
            </form>
        </Layout>
    );
};

export default RegisterPage;