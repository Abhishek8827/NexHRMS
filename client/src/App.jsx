import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { store } from "./app/store";
import AppRoutes from "./routes/index";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "./features/auth/authSlice";
import Spinner from "./components/common/Spinner";

const AuthLoader = ({ children }) => {
  const dispatch = useDispatch();
  const { initialLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("nexhr_token");
    if (token) {
      dispatch(getCurrentUser());
    } else {
      // No token — stop loading immediately
      dispatch({ type: "auth/getMe/rejected" });
    }
  }, [dispatch]);

  if (initialLoading) return <Spinner fullScreen />;

  return children;
};

function App() {
  return (
    <Provider store={store}>
      <AppLoaderWrapper />
    </Provider>
  );
}

function AppLoaderWrapper() {
  return (
    <>
      <AuthLoader>
        <AppRoutes />
      </AuthLoader>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "10px",
            background: "#1f2937",
            color: "#fff",
            fontSize: "14px",
          },
          success: { style: { background: "#059669" } },
          error: { style: { background: "#dc2626" } },
        }}
      />
    </>
  );
}

export default App;
