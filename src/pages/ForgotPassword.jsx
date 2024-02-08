import { useState, useContext } from "react";
import { Button, TextField, Select, MenuItem } from "@mui/material";
import { UserContext } from "../contexts/user.context.jsx";
import { Link, useLocation, useNavigate } from "react-router-dom";

const secretQuestions = [
    "What is your mother's maiden name?",
    "What is the name of your first pet?",
    "What is the name of your favorite teacher?",
    "What is your favorite color?",
    "What is your favorite movie?",
]

function ForgotPassword() {

    const navigate = useNavigate();
    const location = useLocation();

    const { forgotPassword, resetPassword } = useContext(UserContext);
    
    const [UpdatePassword, setUpdatePassword] = useState(false);

    const [form, setForm] = useState({
        email: "",
        password: "",
        secretQuestion: "",
        secretAnswer: "",
    });
    
    const onFormInputChange = (event) => {
        const { name, value } = event.target;
        setForm({ ...form, [name]: value });
    };
    
    const redirectNow = () => {
        const redirectTo = location.search.replace("?redirectTo=", "");
        navigate(redirectTo ? redirectTo : "/");
    }

    const onSubmit = async (event) => {
    try {
        event.preventDefault();
        console.log("Form: ", form)
        const response = await forgotPassword(form.email, form.secretQuestion, form.secretAnswer);
        if (response.status === 200){
            setUpdatePassword(true);
            const res = await resetPassword(form.email, form.password);
            if (res.status === 200){
                console.log("Password Reset Successfully");
                redirectNow('/login');
                setUpdatePassword(false);
            }
            else{
                alert("Error Resetting new password. Try again!");
            }
        }
        else{
            alert("Error Resetting new password. Try again!");
        }
    } catch (error) {
        alert(error);
    }
    };


    return (
        <div className="signup-container">
            <form style={{ display: "flex", flexDirection: "column", maxWidth: "300px", margin: "auto" }}>
                <h1 className="center-text">Forgot Password</h1>
                <TextField
                    label="Email"
                    type="email"
                    variant="outlined"
                    name="email"
                    value={form.email}
                    onInput={onFormInputChange}
                    style={{ marginBottom: "1rem" }}
                />
                {!UpdatePassword && <Select
                    label="Secret Question"
                    variant="outlined"
                    name="secretQuestion"
                    value={form.secretQuestion}
                    onChange={onFormInputChange}
                    style={{ marginBottom: "1rem" }}
                    >{secretQuestions.map((question, index) => (
                        <MenuItem key={index} value={question}>{question}</MenuItem>
                    ))}
                </Select>}
                {!UpdatePassword && <TextField
                    label="Secret Answer"
                    type="text"
                    variant="outlined"
                    name="secretAnswer"
                    value={form.secretAnswer}
                    onInput={onFormInputChange}
                    style={{ marginBottom: "1rem" }}
                />}
                {UpdatePassword && <TextField
                    label="New Password"
                    type="password"
                    variant="outlined"
                    name="password"
                    value={form.password}
                    onInput={onFormInputChange}
                    style={{ marginBottom: "1rem" }}
                />}
                <Button variant="contained" color="primary" onClick={onSubmit}>
                    Submit details
                </Button>
            </form>
        </div>
        
    );
}

export default ForgotPassword;