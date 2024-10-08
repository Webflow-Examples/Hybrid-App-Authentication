import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import DataTable from "./DataTable";
import { ThemeProvider, Button, Container, Typography } from "@mui/material";
import theme from "./theme";

const App = () => {
  const [idToken, setIdToken] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [user, setUser] = useState({});
  const [siteData, setSiteData] = useState([]);

  const PORT = process.env.PORT;
  const API_URL = `http://localhost:${PORT}/`;

  useEffect(() => {
    // Set Extension Size
    webflow.setExtensionSize("default");

    // Function to exchange and verify ID token
    const exchangeAndVerifyIdToken = async () => {
      try {
        const idToken = await webflow.getIdToken();
        const siteInfo = await webflow.getSiteInfo();
        setIdToken(idToken);

        // Resolve token by sending it to the backend server
        const response = await axios.post(API_URL + "token", {
          idToken: idToken,
          siteId: siteInfo.siteId,
        });

        try {
          // Parse information from resolved token
          const sessionToken = response.data.sessionToken;
          const expAt = response.data.exp;
          const decodedToken = JSON.parse(atob(sessionToken.split(".")[1]));
          const firstName = decodedToken.user.firstName;
          const email = decodedToken.user.email;

          // Store information in Local Storage
          localStorage.setItem(
            "wf_hybrid_user",
            JSON.stringify({ sessionToken, firstName, email, exp: expAt })
          );
          setUser({ firstName, email });
          setSessionToken(sessionToken);
          console.log(`Session Token: ${sessionToken}`);
        } catch (error) {
          console.error("No Token", error);
        }
      } catch (error) {
        console.error("Error fetching ID Token:", error);
      }
    };

    // Check local storage for session token
    const localStorageUser = localStorage.getItem("wf_hybrid_user");
    if (localStorageUser) {
      const userParse = JSON.parse(localStorageUser);
      const userStoredSessionToken = userParse.sessionToken;
      const userStoredTokenExp = userParse.exp;
      if (userStoredSessionToken && Date.now() < userStoredTokenExp) {
        if (!sessionToken) {
          setSessionToken(userStoredSessionToken);
          setUser({ firstName: userParse.firstName, email: userParse.email });
        }
      } else {
        localStorage.removeItem("wf_hybrid_user");
        exchangeAndVerifyIdToken();
      }
    } else {
      exchangeAndVerifyIdToken();
    }

    // Listen for message from the OAuth callback window
    const handleAuthComplete = (event) => {
      if (
        // event.origin === "http://localhost:3000" &&
        event.data === "authComplete"
      ) {
        exchangeAndVerifyIdToken(); // Retry the token exchange
      }
    };

    window.addEventListener("message", handleAuthComplete);

    return () => {
      window.removeEventListener("message", handleAuthComplete);
    };
  }, [sessionToken]);

  // Handle request for site data
  const getSiteData = async () => {
    const sites = await axios.get(API_URL + "sites", {
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    setSiteData(sites.data.data.sites);
  };

  // Open OAuth screen
  const openAuthScreen = () => {
    window.open(`http://localhost:${PORT}`, "_blank", "width=600,height=400");
  };

  return (
    <ThemeProvider theme={theme}>
      <div>
        {!user.firstName ? (
          // If no user is found, Send a Hello Stranger Message and Button to Authorize
          <Container sx={{ padding: "20px" }}>
            <Typography variant="h1">👋🏾 Hello Stranger</Typography>
            <Button
              variant="contained"
              sx={{ margin: "10px 20px" }}
              onClick={openAuthScreen}
            >
              Authorize App
            </Button>
          </Container>
        ) : (
          // If a user is found send welcome message with their name
          <Container sx={{ padding: "20px" }}>
            <Typography variant="h1">👋🏾 Hello {user.firstName}</Typography>
            <Button
              variant="contained"
              sx={{ margin: "10px 20px" }}
              onClick={getSiteData}
            >
              Get Sites
            </Button>
            {siteData.length > 0 && <DataTable data={siteData} />}
          </Container>
        )}
      </div>
    </ThemeProvider>
  );
};

// Render your App component inside the root
const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

root.render(<App />);
