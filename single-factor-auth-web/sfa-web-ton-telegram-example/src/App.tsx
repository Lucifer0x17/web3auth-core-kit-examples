import { useEffect, useState } from "react";

// Import Single Factor Auth SDK for no redirect flow
import { Web3Auth, decodeToken } from "@web3auth/single-factor-auth";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";

// TonRPC libraries for blockchain calls
import TonRPC from "./tonRpc";

import Loading from "./Loading";
import "./App.css";

const verifier = import.meta.env.VITE_W3A_VERIFIER_NAME || "w3a-telegram-demo";
const clientId = import.meta.env.VITE_W3A_CLIENT_ID || "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; // get from https://dashboard.web3auth.io

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.OTHER,
  chainId: "mainnet", // Replace with actual TON chain ID
  rpcTarget: "https://toncenter.com/api/v2/jsonTonRPC", // Replace with actual TON TonRPC endpoint
  displayName: "TON Mainnet",
  blockExplorerUrl: "https://tonscan.org",
  ticker: "TON",
  tickerName: "Toncoin",
};

function App() {
  const [web3authSfa, setWeb3authSfa] = useState<Web3Auth | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        const privateKeyProvider = new CommonPrivateKeyProvider({
          config: { chainConfig },
        });

        const web3auth = new Web3Auth({
          clientId, // Get your Client ID from Web3Auth Dashboard
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
          usePnPKey: false, // Setting this to true returns the same key as PnP Web SDK, By default, this SDK returns CoreKitKey.
          privateKeyProvider,
        });

        await web3auth.init(); // Ensure init is called before using web3auth
        setWeb3authSfa(web3auth);

        // Check if there is a token in URL params and attempt login
        const params = new URLSearchParams(window.location.search);
        const jwtToken = params.get("token");
        if (jwtToken) {
          await loginWithWeb3Auth(jwtToken, web3auth);
          window.history.replaceState({}, document.title, window.location.pathname); // Clean up URL
        }
      } catch (error) {
        console.error("Web3Auth initialization failed:", error);
      }
    };

    initWeb3Auth();
  }, []);

  const loginWithWeb3Auth = async (idToken: string, web3auth: Web3Auth) => {
    try {
      setIsLoggingIn(true);
      const { payload } = decodeToken(idToken);
      await web3auth.connect({
        verifier,
        verifierId: (payload as any).sub,
        idToken,
      });
      setLoggedIn(true);
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const getUserInfo = async () => {
    if (!web3authSfa) {
      uiConsole("Web3Auth Single Factor Auth SDK not initialized yet");
      return;
    }
    const userInfo = await web3authSfa.getUserInfo();
    uiConsole(userInfo);
  };

  const logout = () => {
    if (!web3authSfa) {
      uiConsole("Web3Auth Single Factor Auth SDK not initialized yet");
      return;
    }
    web3authSfa.logout();
    setLoggedIn(false);
    return;
  };

  const getAccounts = async () => {
    if (!web3authSfa.provider) {
      uiConsole("No provider found");
      return;
    }
    const rpc = new TonRPC(web3authSfa.provider);
    const userAccount = await rpc.getAccounts();
    uiConsole(userAccount);
  };

  const getBalance = async () => {
    if (!web3authSfa.provider) {
      uiConsole("No provider found");
      return;
    }
    const rpc = new TonRPC(web3authSfa.provider);
    const balance = await rpc.getBalance();
    uiConsole(balance);
  };

  const signMessage = async () => {
    if (!web3authSfa.provider) {
      uiConsole("No provider found");
      return;
    }
    const rpc = new TonRPC(web3authSfa.provider);
    const result = await rpc.signMessage("Hello, TON!");
    uiConsole(`Message signed. Signature: ${result}`);
  };

  const sendTransaction = async () => {
    if (!web3authSfa.provider) {
      uiConsole("No provider found");
      return;
    }
    const rpc = new TonRPC(web3authSfa.provider);
    const result = await rpc.sendTransaction();
    uiConsole("Transaction Hash:", result.transactionHash);
  };

  const authenticateUser = async () => {
    // try {
    const userCredential = await web3authSfa.authenticateUser();
    uiConsole(userCredential);
    // } catch (err) {
    //   uiConsole(err);
    // }
  };

  const getPrivateKey = async () => {
    if (!web3authSfa.provider) {
      uiConsole("No provider found");
      return "";
    }
    const rpc = new TonRPC(web3authSfa.provider);
    const privateKey = await rpc.getPrivateKey();
    return privateKey;
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }

  const loginView = (
    <>
      <div className="flex-container">
        <div>
          <button onClick={getUserInfo} className="card">
            Get User Info
          </button>
        </div>
        <div>
          <button onClick={authenticateUser} className="card">
            Authenticate User
          </button>
        </div>
        <div>
          <button onClick={getAccounts} className="card">
            Get Accounts
          </button>
        </div>
        <div>
          <button onClick={getBalance} className="card">
            Get Balance
          </button>
        </div>
        <div>
          <button onClick={signMessage} className="card">
            Sign Message
          </button>
        </div>
        <div>
          <button onClick={sendTransaction} className="card">
            Send Transaction
          </button>
        </div>
        <div>
          <button onClick={getPrivateKey} className="card">
            Get Private Key
          </button>
        </div>
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>

      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
    </>
  );

  const logoutView = (
    <button onClick={login} className="card">
      Login
    </button>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="https://web3auth.io/docs/sdk/core-kit/sfa-web" rel="noreferrer">
          Web3Auth
        </a>{" "}
        SFA React Telegram GitHub Example
      </h1>

      {isLoggingIn ? <Loading /> : <div className="grid">{web3authSfa ? (loggedIn ? loginView : logoutView) : null}</div>}

      <footer className="footer">
        <a
          href="https://github.com/Web3Auth/web3auth-core-kit-examples/tree/main/single-factor-auth-web/sfa-web-auth0-example"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;
