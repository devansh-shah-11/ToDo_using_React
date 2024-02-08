import { useState } from "react";
import { Button, TextField, Select, MenuItem } from "@mui/material";
import { UserContext } from "../contexts/user.context.jsx";

const secretQuestions = [
    "What is your mother's maiden name?",
    "What is the name of your first pet?",
    "What is the name of your favorite teacher?",
    "What is your favorite color?",
    "What is your favorite movie?",
]

function ForgotPassword() {
    
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
    
    const onSubmit = async () => {
    try {
        console.log("Form: ", form)
        const response = await ResetPassword(form.email, form.secretQuestion, form.secretAnswer);
        if (response.status === 200){
            redirectNow('/login');
        }
        else{
            alert("Error signing up. Try again!");
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
                <Select
                    label="Secret Question"
                    variant="outlined"
                    name="secretQuestion"
                    value={form.secretQuestion}
                    onChange={onFormInputChange}
                    style={{ marginBottom: "1rem" }}
                    >{secretQuestions.map((question, index) => (
                        <MenuItem key={index} value={question}>{question}</MenuItem>
                    ))}
                </Select>
                <TextField
                    label="Secret Answer"
                    type="text"
                    variant="outlined"
                    name="secretAnswer"
                    value={form.secretAnswer}
                    onInput={onFormInputChange}
                    style={{ marginBottom: "1rem" }}
                />
                <Button variant="contained" color="primary" onClick={onSubmit}>
                    Submit details
                </Button>
            </form>
        </div>
        
    );
}

export default ForgotPassword;