# Hybrid APP Authentication with ID Tokens

## Introduction

This code sample demonstrates how to implement authentication using ID Tokens in a [Webflow Hybrid App](https://docs.developers.webflow.com/data/docs/hybrid-apps). It provides a starting point for setting up authentication middleware, server-side logic, and integrating with a Designer Extension frontend.

## Getting Started

### Prerequisites

Before setting up this project in your local dev environment, follow these steps:

1. Setup [ngrok](https://ngrok.com/) locally, which will allow you to proxy localhost server ports to a public-facing `https`-based URL
   - Sign up for a free ngrok account
   - [Setup ngrok on your machine](https://developers.webflow.com/data/docs/getting-started-data-clients#step-1-setup-your-local-development-environment)
   - Run `ngrok http 3000` to expose your localhost `3000` port at a generated URL (or your own port specified in `.env`)
2. [Register a Webflow App](https://developers.webflow.com/data/docs/register-an-app)
   - Ensure to toggle both Designer extension and Data client APIs to "On"
   - Set the following "scopes"/building block permissions:
     - **Authorized user:** Read-only
     - **Sites:** Read and Write
   - Use the `https`-based ngrok URLs (i.e. `https://my-url.ngrok.io/`) to set the App homepage URL and the Redirect URI with the values below (as an example):
     - **App homepage url:** https://my-url.ngrok.io/
     - **Redirect URI:** https://my-url.ngrok.io/callback

### Start the App

To run the application, follow these steps:

1. Clone this repository to your local machine.
2. Install dependencies by running `npm install`.
3. Create a copy of the `.env.example` file and name it `.env`. Fill the values for each of the variables outlined in the section below.
4. Start the application by running `npm run dev`.

### Environment Variables

Ensure the following environment variables are configured. You can find these details in your Webflow workspace for your newly registered Webflow App:

- `WEBFLOW_CLIENT_ID`: Webflow Client ID
- `WEBFLOW_CLIENT_SECRET`: Webflow Client Secret
- `PORT`: (Optional) Specify a port for your server, otherwise it will serve at port `3000` by default.

## Additional Resources

For more detailed instructions on setting up JWT middleware, configuring the server, and integrating with the Designer Extension frontend, please refer to the following guide:

[Authentication Guide](https://developers.webflow.com/data/docs/authenticating-users-with-id-tokens)
