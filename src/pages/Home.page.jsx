import { Button } from '@mui/material'
import { useContext } from 'react';
import { UserContext } from '../contexts/user.context.jsx';

const Home = () => {
    const { logOutUser } = useContext(UserContext);
    const { user } = useContext(UserContext);

    const logOut = async () => {
    try {
        console.log("Logging out user: ", user);
        const loggedOut = await logOutUser(user);
        if (loggedOut) {
        window.location.reload(true);
        }
    } catch (error) {
        alert(error)
    }
    }
    
    return (
    <>
        <h1>Welcome to your ToDo App</h1>
        <Button variant="contained" onClick={logOut}>Logout</Button>
    </>
    )
}

export default Home;