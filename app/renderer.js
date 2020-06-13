const path = require("path");
const marked = require("marked");
const { remote, ipcRenderer } = require("electron");

const mainProcess = remote.require("./main.js");
const currentWindow = remote.getCurrentWindow();

const markdownView = document.querySelector("#markdown");
const htmlView = document.querySelector("#html");
const newFileButton = document.querySelector("#new-file");
const openFileButton = document.querySelector("#open-file");
const saveMarkdownButton = document.querySelector("#save-markdown");
const revertButton = document.querySelector("#revert");
const saveHtmlButton = document.querySelector("#save-html");
const showFileButton = document.querySelector("#show-file");
const openInDefaultButton = document.querySelector("#open-in-default");

let filePath = null;
let originalContent = "";

const renderMarkdownToHtml = (markdown) => {
  htmlView.innerHTML = marked(markdown, { sanitize: true });
};
markdownView.addEventListener("keyup", (event) => {
  const currentContent = event.target.value;
  renderMarkdownToHtml(currentContent);
  updateUserInterface(currentContent !== originalContent);
});

openFileButton.addEventListener("click", () => {
  mainProcess.getFileFromUser(currentWindow);
});

ipcRenderer.on("file-opened", (event, file, content) => {
  filePath = file;
  originalContent = content;
  markdownView.value = content;
  renderMarkdownToHtml(content);
  updateUserInterface();
});

newFileButton.addEventListener("click", () => {
  mainProcess.createWindow();
});

const updateUserInterface = (isEdited) => {
  let title = "Fire Sale";
  if (filePath) {
    title = `${path.basename(filePath)} - ${title}`;
  }
  if (isEdited) {
    title += " (Edited)";
  }
  currentWindow.setTitle(title);
  currentWindow.setDocumentEdited(isEdited);
  saveMarkdownButton.disabled = !isEdited;
  revertButton.disabled = !isEdited;
};

saveHtmlButton.addEventListener("click", () => {
  mainProcess.saveHtml(currentWindow, htmlView.innerHTML);
  console.log(htmlView.innerHTML);
});

saveMarkdownButton.addEventListener("click", () => {
  mainProcess.saveMarkdown(currentWindow, filePath, markdownView.value);
});

revertButton.addEventListener("click", () => {
  markdownView.value = originalContent;
  renderMarkdownToHtml(originalContent);
  updateUserInterface();
});
const getDraggedFile = (event) => event.dataTransfer.items[0];
const getDroppedFile = (event) => event.dataTransfer.files[0];
const fileTypeIsSupported = (file) => {
  return ["text/plain", "text/markdown"].includes(file.type);
};

document.addEventListener("dragstart", (event) => event.preventDefault());
document.addEventListener("dragover", (event) => event.preventDefault());
document.addEventListener("dragleave", (event) => event.preventDefault());
document.addEventListener("drop", (event) => event.preventDefault());

markdownView.addEventListener("dragover", (event) => {
  const file = getDraggedFile(event);

  if (fileTypeIsSupported(file)) {
    markdownView.classList.add("drag-over");
  } else {
    markdownView.classList.add("drag-error");
  }
});
markdownView.addEventListener("dragleave", () => {
  markdownView.classList.remove("drag-over");
  markdownView.classList.remove("drag-error");
});

markdownView.addEventListener("drop", (event) => {
  const file = getDroppedFile(event);

  if (fileTypeIsSupported(file)) {
    mainProcess.openFile(currentWindow, file.path);
  } else {
    alert("That file type is not suported");
  }
  markdownView.classList.remove("drag-over");
  markdownView.classList.remove("drag-error");
});
