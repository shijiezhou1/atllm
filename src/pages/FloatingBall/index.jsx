import logo from "../../assets/electron.svg";
import searchIcon from "../../assets/search_icon.png";
import { useEffect } from "react";
import { AUTH_TIMESTAMP, AUTH_TOKEN, AUTH_USER } from "@/utils/constants";
import "./index.css";

export default function FloatingBall() {
  const { send } = window.electron.ipcRenderer;

  // const localUser = localStorage.getItem(AUTH_USER);
  const localAuthToken = localStorage.getItem(AUTH_TOKEN);
  // const [store, setStore] = useState({
  //   user: localUser ? JSON.parse(localUser) : null,
  //   authToken: localAuthToken ? localAuthToken : null,
  // });

  let biasX = 0;
  let biasY = 0;

  const moveEvent = (e) => {
    send("suspensionWindowMove", {
      x: e.screenX - biasX,
      y: e.screenY - biasY,
    });
  };

  const initSuspension = () => {
    const suspensionDom = document.getElementsByClassName("suspension")[0];
    suspensionDom.addEventListener("mousedown", function (e) {
      switch (e.button) {
        case 0:
          biasX = e.x;
          biasY = e.y;
          document.addEventListener("mousemove", moveEvent);
          break;
        case 2:
          ``;
          send("createSuspensionMenu");
          break;
      }
    });
    suspensionDom.addEventListener("mouseup", function () {
      biasX = 0;
      biasY = 0;
      document.removeEventListener("mousemove", moveEvent);
    });
  };

  useEffect(() => {
    initSuspension();
  }, []);

  const handleSearchClicked = () => {
    // http://localhost:5173/workspace/test
    send("copyText");
    const route = "/workspace/test";
    send("navigateTo", route);
    // send("trigger-notify", "Hello from the first window!");
  };

  return (
    <div className="floating-ball">
      <div
        className="suspension"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-evenly",
          backgroundColor: "white",
          borderRadius: "20px",
          overflow: "hidden",
          padding: "5px",
        }}
      >
        <div
          className="logo-icon"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img draggable="false" src={logo} alt="Logo" width="30" height="30" />
        </div>
        <div className="search-icon" onClick={handleSearchClicked}>
          <img
            draggable="false"
            src={searchIcon}
            alt="Search"
            width="30"
            height="30"
          />
        </div>
      </div>
    </div>
  );
}
