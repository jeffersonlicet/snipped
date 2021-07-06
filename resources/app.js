const node = document.getElementById("output");
const containerNode = document.getElementById("container");
const contentNode = document.getElementById("content");

const copyButton = document.getElementById("copy");
const downloadButton = document.getElementById("download");

const vscode = acquireVsCodeApi();

function base64ToBlob(b64Data, contentType = "", sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

async function copyImage() {
  const url = await domtoimage.toPng(contentNode, {
    bgColor: "transparent",
    scale: 3,
  });

  const blob = base64ToBlob(url.slice(url.indexOf(",") + 1), "image/png");
  const item = new ClipboardItem({ "image/png": blob });

  navigator.clipboard.write([item]);
  console.log(url);
  vscode.postMessage({ type: "copied" });
}

async function downloadImage() {
  const data = await domtoimage.toPng(contentNode, {
    bgColor: "transparent",
    scale: 3,
  });

  vscode.postMessage({ type: "download", data });
}

copyButton.addEventListener("click", copyImage);
downloadButton.addEventListener("click", downloadImage);

document.addEventListener("paste", async (e) => {
  const html =
    e.clipboardData.getData("text/html") ||
    e.clipboardData.getData("text/plain");
  node.innerHTML = `<div id="code">${html}</div>`;

  const codeNode = document.getElementById("code");
  const lineHeight = codeNode.querySelector("div").style.lineHeight;

  const linesNode = document.getElementById("lines");
  const titleNode = document.getElementById("title");

  const { start, end, fileName } = window.__data__;

  titleNode.innerHTML = fileName;

  for (let i = start; i <= end + 1; i++) {
    const newNodeChild = document.createElement("span");
    newNodeChild.innerHTML = i;
    newNodeChild.style.lineHeight = lineHeight;
    linesNode.appendChild(newNodeChild);
  }

  containerNode.style.opacity = 1;
  containerNode.classList.add("bounce");
  /*
  

*/
  vscode.postMessage({ type: "end", data: {} });
});

setTimeout(() => document.execCommand("paste"), 300);
