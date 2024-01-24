import { Button, TextField } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/user.context.jsx";
import "./Login.css";
import FacebookLogin from '@greatsumini/react-facebook-login';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const { user, fetchUser, emailPasswordLogin , facebooklogin} = useContext(UserContext);
    
    const [form, setForm] = useState({
        email: "",
        password: ""
    });
    
    const onFormInputChange = (event) => {
        const { name, value } = event.target;
        setForm({ ...form, [name]: value });
    };
    
    const redirectNow = () => {
        const redirectTo = location.search.replace("?redirectTo=", "");
        navigate(redirectTo ? redirectTo : "/");
    }
    
    //added below new
    const onSubmit = async (event) => {
        event.preventDefault();
        try {
            const user = await emailPasswordLogin(form.email, form.password);
            if (user) {
                redirectNow();
            }
        } catch (error) {
            if (error.statusCode === 401) {
                alert("Invalid username/password. Try again!");
            } else {
                alert(error);
            }
        }
    };

    const loadUser = async () => {
    if (!user) {
        const fetchedUser = await emailPasswordLogin(form.email, form.password);
        if (fetchedUser) {
        redirectNow();
        }
    }
    }
    
    useEffect(() => {
    loadUser(); 
    }, []);
    
    const ProfileSuccess = async (response) => {
        try{
                console.log("Response ", response);
                const accessToken = response.id;
                const email = response.email;
                const name = response.name;
                const user = await facebooklogin(accessToken, email, name);
                console.log("accessToken: ", user);
                if (user) {
                    redirectNow();
                }
            }
        catch (error) {
            console.log(error);
        }
    }
    
    return (
        <div className="login-container">
            <form style={{ display: "flex", flexDirection: "column", maxWidth: "300px", margin: "auto" }} onSubmit={onSubmit}>
                <h1 className="center-text">Login</h1>
                <TextField
                    label="Email"
                    type="email"
                    variant="outlined"
                    name="email"
                    value={form.email}
                    onChange={onFormInputChange}
                    style={{ marginBottom: "1rem" }}
                    required
                />
                <TextField
                    label="Password"
                    type="password"
                    variant="outlined"
                    name="password"
                    value={form.password}
                    onChange={onFormInputChange}
                    style={{ marginBottom: "1rem" }}
                    required
                />
                <Button variant="contained" color="primary" type="submit" className="login-btn">
                    Login
                </Button>
                <br></br>
                <div className="fb-login-btn">
                    <FacebookLogin
                        appId="813331880600210"
                        fields="name,email,picture"
                        onSuccess={(response) => {
                            console.log('Login Success!', response);
                        }}
                        onFail={(error) => {
                            console.log('Login Failed!', error);
                        }}
                        onProfileSuccess={(response) => {
                            ProfileSuccess(response);
                            console.log('Get Profile Success!', response);
                        }}
                    />
                </div>
                <p>Don't have an account? <Link to="/signup">Signup</Link></p>
            </form>
        </div>
    );
}

export default Login;