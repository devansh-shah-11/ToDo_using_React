import { createContext, useState } from "react";
import axios from "axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const facebooklogin = async (accessToken, email, name) => {
        try {
            console.log("Registering user...", name, email, accessToken);
            const url = 'http://localhost:3001/facebooklogin';
            const response = await axios.post(
                url, {
                    params: {
                        accessToken: accessToken,
                        email: email,
                        name: name,
                    }
                }
            );
            // const url = `http://localhost:8000/users/facebooklogin`;
            // const response = await axios.post(
            //     url,
            //     {
            //         accessToken: accessToken,
            //         email: email,
            //         name: name,
            //     }
            // );
            console.log("Response: ", response);
            const session_token = response.data.session_token;
            if (session_token !== null){
                setUser(session_token)
                console.log("Successfully logged in! ", session_token);
                return session_token;
            }
            else{
                return {"error": "Invalid username/password. Try again!"}
            }
        } catch (error) {
            console.log("Error logging in user: ", error);
            throw error;
        }
    };

    const emailPasswordLogin = async (email, password) => {
        try{
            const url = 'http://localhost:3001/login';
            const response = await axios.post(
                url, {
                    params: {
                        email: email,
                        password: password,
                    }
                }
            );
            console.log("Response: ", response.data);
            const session_token = response.data.session_token;
            
            if (session_token !== null){
                setUser(session_token)
                console.log("Successfully logged in! ", session_token);
                return session_token;
            }
            else{
                return {"error": "Invalid username/password. Try again!"}
            }
        } catch (error) {
            console.log("Error logging in user: ", error);
            throw error;
        }
    };

    const emailPasswordSignup = async (name, email, password) => {
        console.log("Registering user...", name);
        try {
            // const url = 'http://localhost:8000/users/signup';
            // const response = axios.post(
            //     url,
            //     {
            //         name: name,
            //         email: email,
            //         password: password,
            //     }
            // );
            const url = 'http://localhost:3001/signup';
            const response = await axios.post(
                url, {
                    params: {
                        name: name,
                        email: email,
                        password: password,
                    }
                }
            );
            console.log("Response: ", response)
            console.log("Successfully registered!");
            return response;
            // return emailPasswordLogin(email, password);
        } catch (error) {
            console.log("Error registering user: ", error);
            throw error;
        }
    };

    const logOutUser = async (session_token) => {
        try {
            // const url = `http://127.0.0.1:8000/users/logout?token=${session_token}`;
            // const response = await axios.post(url);
            const url = 'http://localhost:3001/logout';
            const response = await axios.post(
                url, {
                    headers: {
                        session_token: session_token,
                    }
                }
            );
            setUser(null);
            console.log("Successfully logged out!");
            return response;
        } catch (error) {
            console.log("Error finding user : ", error);
            throw error;
        }
    };

    return (
        <UserContext.Provider
        value={{
            user,
            setUser,
            emailPasswordLogin,
            facebooklogin,
            emailPasswordSignup,
            logOutUser,
        }}
        >
        {children}
        </UserContext.Provider>
    );
};
