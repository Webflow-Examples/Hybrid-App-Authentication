import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import DataTable from "./DataTable";
import { ThemeProvider, Button, Container, Typography } from "@mui/material";
import theme from './theme'

const App = () => {
  const [idToken, setIdToken] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [user, setUser] = useState({});
  const [siteData, setSiteData] = useState([]);

  const PORT = 3000;
  const API_URL = `http://localhost:${PORT}/`;

  useEffect(() => {
    // Set Extension Size
    webflow.setExtensionSize("default");

    // Fetch ID Token and send it to the Data Client
    const exchangeAndVerifyIdToken = async () => {
      try {
        // Get ID Token from Webflow
        const idToken = await webflow.getIdToken();
        setIdToken(idToken);

        console.log(`idToken: ${idToken}`);

        // Send token to Webflow, and wait for a response with a JWT from our Data Client
        const getSessionToken = async (idToken) => {

          // Send ID Token to the Data Client
            const response = await axios.post(API_URL + "token", {
              idToken: idToken,
            });

            try {
              // Store sessionToken in Local Storage
              const sessionToken = response.data.sessionToken;

              // Decode the sessionToken
              const decodedToken = JSON.parse(atob(sessionToken.split(".")[1]));
              const firstName = decodedToken.user.firstName;
              const email = decodedToken.user.email;

              localStorage.setItem(
                "user",
                JSON.stringify({
                  sessionToken: sessionToken,
                  firstName: firstName,
                  email: email,
                })
              );
              setUser({ firstName, email });
              setSessionToken(sessionToken);
              console.log(`Session Token: ${sessionToken}`);
            } catch (error) {
              console.error("No Token", error);
            }
        };
        await getSessionToken(idToken);
      } catch (error) {
        console.error("Error fetching ID Token:", error);
      }
    };

  // Run function
  exchangeAndVerifyIdToken();
  }, []);

  // Handle request for site data
  const getSiteData = async () => {
    const sites = await axios.get(API_URL + "sites", {
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    setSiteData(sites.data.data.sites);
  };

  return (
    <ThemeProvider theme={theme}>
      <div>
      <Container sx={{padding:'20px'}}>
        <Typography variant="h1">👋🏾 Hello {user.firstName}</Typography>
        <Button variant="contained" sx={{ margin: '10px 20px' }} onClick={getSiteData}>Get Sites</Button>
        {siteData.length > 0 && <DataTable data={siteData} />}
        </Container>
      </div>
    </ThemeProvider>
  );
};

// Render your App component inside the root
const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

root.render(<App />);
