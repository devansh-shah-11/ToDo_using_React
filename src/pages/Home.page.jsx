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
        <div className="logout-button-container">
            <Button variant="contained" onClick={logOut}>Logout</Button>
        </div>
    </>
    )
}

export default Home;