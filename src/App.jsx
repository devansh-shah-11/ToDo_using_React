import { BrowserRouter, Route, Routes } from "react-router-dom";
import { UserProvider } from "./contexts/user.context.jsx";
import ToDoApp from "./Todo.jsx";
import Login from "./pages/Login.page.jsx";
import PrivateRoute from "./pages/PrivateRoute.page.jsx";
import Signup from "./pages/Signup.page.jsx";

function App() {
    return (
    <BrowserRouter>
        {/* We are wrapping our whole app with UserProvider so that */}
        {/* our user is accessible through out the app from any page*/}
        <UserProvider>
        <Routes>
            <Route exact path="/login" element={<Login />} />
            <Route exact path="/signup" element={<Signup />} />
            {/* We are protecting our Home Page from unauthenticated */}
            {/* users by wrapping it with PrivateRoute here. */}
            <Route element={<PrivateRoute />}>
            <Route exact path="/" element={<ToDoApp />} />
            </Route>
        </Routes>
        </UserProvider>
    </BrowserRouter>
    );
    }

export default App;