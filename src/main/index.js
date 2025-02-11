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

const pages = {
  floatingWindow: undefined,
  homeWindow: undefined,
};

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: true,
      webSecurity: true,
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      allowRunningInsecureContent: false,
    },
  });

  console.log({
    rendererindexhtml: join(__dirname, "../index.html"),
    ELECTRON_RENDERER_URL: process.env["ELECTRON_RENDERER_URL"],
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"] + "/workspace/test");
  } else {
    win.loadFile(join(__dirname, "../index.html"));
  }

  return win;
};

const createFloatingWindow = () => {
  const suspensionConfig = {
    width: 80,
    height: 40,
  };

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
      contextIsolation: false,
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

  ipcMain.on("navigateTo", (event, route) => {
    let currentURL = pages.homeWindow.webContents.getURL();
    console.log({ currentURL });
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
  ipcMain.on("createSuspensionMenu", (e) => {
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
        {
          label: "上传复制文字",
          click: () => {},
        },
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
  ipcMain.on("trigger-notify", (event, message) => {
    // 将消息发送到第二个窗口
    pages.homeWindow.webContents.send("notify", message);
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
  // pages.floatingWindow.webContents.openDevTools({ mode: "detach" });

  ipcMain.on("suspensionWindowMove", (event, message) => {
    pages.floatingWindow.setPosition(message.x, message.y);
  });

  ipcMain.on("copyText", (event, data) => {
    const text = clipboard.readText();
    console.log({ copyText: text });
    if (pages.homeWindow === null) {
      initHomePageSetting(pages);
    } else {
      pages.homeWindow.focus();
    }
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
