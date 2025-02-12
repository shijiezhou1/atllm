import { CHANNELS } from "@/utils/constants";
import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  screen,
  Menu,
  clipboard,
} from "electron";
import { join } from "path";
const { electronApp, optimizer, is } = require("@electron-toolkit/utils");

if (process.platform === 'darwin') {
  if (process.arch === 'x64') {
    console.log('Disabling hardware acceleration on Intel-based Mac');
    app.disableHardwareAcceleration();
  } else {
    console.log('Running on Apple Silicon (M1/M2), hardware acceleration is enabled');
  } 
}
const pages = Object.seal({
  floatingWindow: null,
  homeWindow: null,
});

let lastCopiedText = '';

const createWindow = () => {
  const win = new BrowserWindow({
    width: 500,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: true,
      webSecurity: false,
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      // allowRunningInsecureContent: false,
    },
  });

  console.log({
    rendererindexhtml: join(__dirname, "../index.html"),
    ELECTRON_RENDERER_URL: process.env["ELECTRON_RENDERER_URL"],
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"] + "/workspace/test");
  } else {
    // win.loadFile("./dist/_index.html");
    win.loadFile(join(__dirname, "../index.html"));
  }

  return win;
};

const createFloatingWindow = () => {
  const suspensionConfig = Object.freeze({
    width: 80,
    height: 40,
  });

  const win = new BrowserWindow({
    width: suspensionConfig.width,
    height: suspensionConfig.height,
    type: "toolbar",
    frame: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    show: false,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: true,
      webSecurity: false,
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
    },
  });

  win.on("ready-to-show", () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"] + "/floatingball");
  } else {
    // win.loadFile("./dist/_index.html");
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  const { left, top } = {
    left: screen.getPrimaryDisplay().workAreaSize.width - 150,
    top: screen.getPrimaryDisplay().workAreaSize.height - 100,
  };

  win.setPosition(left, top);

  return win;
};

const initHomePageSetting = (pages) => {
  pages.homeWindow = createWindow();
  pages.homeWindow.focus();

  ipcMain.on(CHANNELS.focusHomeWindow, ()=>{
    pages.homeWindow.focus();
  })

  ipcMain.on(CHANNELS.navigateTo, (event, route) => {
 
    let currentURL = pages.homeWindow.webContents.getURL();
    // console.log({ currentURL });
    if (currentURL.includes("/workspace/test")) {
      return;
    }
    if (pages.homeWindow) {
      if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
        pages.homeWindow.loadURL(
          `${process.env["ELECTRON_RENDERER_URL"]}${route}`
        );
      } else {
        pages.homeWindow.loadFile(path.join(__dirname, "../index.html"), {
          hash: route,
        });
      }
    }
  });

  let suspensionMenu = null; //悬浮球右击菜单
  //创建悬浮球右击菜单
  ipcMain.on(CHANNELS.createSuspensionMenu, (e) => {
    if (!suspensionMenu) {
      suspensionMenu = Menu.buildFromTemplate([
        {
          label: "打开客户端",
          click: () => {
            if (pages.homeWindow === null) {
              initHomePageSetting(pages);
            }
          },
        },
        // {
        //   label: "上传复制文字",
        //   click: () => {},
        // },
        {
          label: "关闭悬浮球",
          click: () => {
            if (pages.floatingWindow === null) {
              pages.floatingWindow = createWindow();
            }
          },
        },
        {
          label: "退出软件",
          click: () => {
            app.quit();
          },
        },
      ]);
    }
    suspensionMenu.popup({});
  });

  // 监听来自渲染进程的消息
  ipcMain.on(CHANNELS.triggerNotify, (event, message) => {
    // 将消息发送到第二个窗口
    pages.homeWindow.webContents.send("notify", message);
  });


  ipcMain.on(CHANNELS.copyText, (event, data) => {
    
    const text = clipboard.readText();
    if (text === lastCopiedText) return;
    event.sender.send(CHANNELS.copyTextReply, text);
    
    lastCopiedText = text;
    console.log('🍎🍎🍎',lastCopiedText)
    
    if (pages.homeWindow === null) {
      initHomePageSetting(pages);
    } else {
      pages.homeWindow.focus();
    }
  });

  pages.homeWindow.on("close", (e, data) => {
    console.log("homeWindow", { data });
    pages.homeWindow = null;
  });
};

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  initHomePageSetting(pages);
  pages.floatingWindow = createFloatingWindow();

  // TODO: debug mode
  // pages.homeWindow.webContents.openDevTools({ mode: "detach" });
  // pages.floatingWindow.webContents.openDevTools({ mode: "detach" });

  ipcMain.on(CHANNELS.suspensionWindowMove, (event, message) => {
    pages.floatingWindow.setPosition(message.x, message.y);
  });

  pages.floatingWindow.on("close", (e, data) => {
    pages.floatingWindow = null;
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    pages.homeWindow = createWindow();
    pages.floatingWindow = createFloatingWindow();
  }
});
