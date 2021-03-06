const { app, BrowserWindow, dialog } = require("electron");
const fs = require("fs");
const { create } = require("domain");

let mainWindow = null;

const windows = new Set();
const createWindow = (exports.createWindow = () => {
  let newWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  newWindow.loadFile(__dirname + "/index.html");
  newWindow.once("ready-to-show", () => {
    newWindow.show();
  });
  newWindow.on("closed", () => {
    windows.delete(newWindow);
    newWindow = null;
  });
  windows.add(newWindow);
  return newWindow;
});
app.on("ready", () => {
  createWindow();
});
const getFileFromUser = (exports.getFileFromUser = (targetWindow) => {
  const files = dialog.showOpenDialogSync(targetWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Markdown Files", extensions: ["md", "markdown"] },
      { name: "Text Files", extensions: ["txt"] },
    ],
  });
  if (files) {
    openFile(targetWindow, files[0]);
  }
});
const openFile = (exports.openFile = (targetWindow, file) => {
  const content = fs.readFileSync(file).toString();
  // 将编辑过的文件添加到系统的最近打开
  app.addRecentDocument(file);
  // macos
  targetWindow.setRepresentedFilename(file);
  targetWindow.webContents.send("file-opened", file, content);
});

app.on("window-all-closed", () => {
  if (process.platform === "darwin") return false;
  app.quit();
});

app.on("activate", (event, hasVisibleWindow) => {
  if (!hasVisibleWindow) createWindow();
});
app.on("will-finish-launching", () => {
  app.on("open-file", (event, file) => {
    const win = createWindow();
    win.once("ready-to-show", () => {
      openFile(win, file);
    });
  });
});

const saveHtml = (exports.saveHtml = (targetWindow, content) => {
  const file = dialog.showSaveDialogSync(targetWindow, {
    title: "Save HTML",
    defaultPath: app.getPath("documents"),
    filters: [
      {
        name: "HTML Files",
        extensions: ["html", "htm"],
      },
    ],
  });
  if (!file) return;
  fs.writeFileSync(file, content);
});

const saveMarkdown = (exports.saveMarkdown = (targetWindow, file, content) => {
  if (!file) {
    file = dialog.showSaveDialogSync(targetWindow, {
      title: "Save Markdown",
      defaultPath: app.getPath("documents"),
      filters: [
        {
          name: "Markdwon Files",
          extensions: ["md", "markdown"],
        },
      ],
    });
  }
  if (!file) return;
  fs.writeFileSync(file, content);
  openFile(targetWindow, file);
});
