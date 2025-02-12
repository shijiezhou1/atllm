import logo from '../../assets/electron.svg';
import searchIcon from '../../assets/search_icon.png';
import uploadIcon from '../../assets/upload.gif';
import { useEffect } from 'react';
import {
  API_KEY,
  AUTH_TIMESTAMP,
  AUTH_TOKEN,
  AUTH_USER,
  CHANNELS,
} from '@/utils/constants';
import './index.css';
import { useState } from 'react';
import { Check, UploadSimple } from '@phosphor-icons/react';
import BrowserExtensionApiKey from '@/models/browserExtensionApiKey';

const NOTIFICATION_MAP = {
      success: {
        title: "Success",
        icon: "✅",
      },
      error: {
        title: "Error",
        icon: "❌",
      },
      loading: {
        title: "Loading",
        icon: "⏳",
      }
    }

export default function FloatingBall() {

  // TODO: load the page after authenticate

  const [data, setData] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const { send } = window.electron.ipcRenderer;

  let biasX = 0;
  let biasY = 0;

  

  const moveEvent = (e) => {
    send(CHANNELS.suspensionWindowMove, {
      x: e.screenX - biasX,
      y: e.screenY - biasY,
    });
  };

  const initSuspension = () => {
    const suspensionDom = document.getElementsByClassName('suspension')[0];
    suspensionDom.addEventListener('mousedown', function (e) {
      switch (e.button) {
        case 0:
          biasX = e.x;
          biasY = e.y;
          document.addEventListener('mousemove', moveEvent);
          break;
        case 2:
          send(CHANNELS.createSuspensionMenu);
          break;
      }
    });
    suspensionDom.addEventListener('mouseup', function () {
      biasX = 0;
      biasY = 0;
      document.removeEventListener('mousemove', moveEvent);
    });
  };

  useEffect(() => {
    initSuspension();

    window.electron.ipcRenderer.on(CHANNELS.copyTextReply, async (event, arg) => {
      setIsLoading(true);
      // TODO: make the api call and set back loader after finish
      console.log({arg});

      const { data } = await BrowserExtensionApiKey.checkApiKey(API_KEY);
      const { apiKeyId, connected, workspaces } = data;
      console.log(apiKeyId, connected, workspaces[0].id);

      const embedData = await BrowserExtensionApiKey.embedToWorkspace(API_KEY, workspaces[0].id, arg, "xxx", "xxx");
      if (embedData.error === null) {
        setIsLoading(false);
      }
      
    });
  }, []);

  const handleSearchClicked = () => {
    // http://localhost:5173/workspace/test
    send(CHANNELS.copyText);
    const route = '/workspace/test';
    send(CHANNELS.navigateTo, route);
    send(CHANNELS.triggerNotify, 'Hello from the first window!');
  };

  const handleFocusHomePage = () => {
    send(CHANNELS.focusHomeWindow);
  }

  // const LoadingSpin = () => {
  //   return (
  //     <UploadSimple size={30} />
  //     // <Check size={30} />
  //   );
  // };

  return (
    <div className="floating-ball">
      <div
        className="suspension"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          backgroundColor: 'white',
          borderRadius: '20px',
          overflow: 'hidden',
          padding: '5px',
        }}
      >
        <div
          className="logo-icon"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onClick={handleFocusHomePage}
        >
          <img draggable="false" src={logo} alt="Logo" width="30" height="30" />
        </div>
        <div className="search-icon" onMouseEnter={handleSearchClicked}>
          {isLoading ? (
            <div className="loading-spinner">
              <img
              draggable="false"
              src={uploadIcon}
              alt="upload"
              width="30"
              height="30"
            />
            </div>
          ) : (
            <img
              draggable="false"
              src={searchIcon}
              alt="Search"
              width="30"
              height="30"
            />
          )}
        </div>
      </div>
    </div>
  );
}
