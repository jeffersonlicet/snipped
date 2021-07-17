(function () {
  const vscode = acquireVsCodeApi();
  const node = document.getElementById("output");

  const copyButton = document.querySelector("#copy");
  const tweetButton = document.querySelector("#tweet");
  const downloadButton = document.querySelector("#download");
  const footer = document.querySelector("#footer");

  copyButton.addEventListener("click", () => copyImage(false));
  downloadButton.addEventListener("click", downloadImage);
  tweetButton.addEventListener("click", composeTweet);

  const contentNode = document.getElementById("content");
  const containerNode = document.getElementById("container");

  function base64ToBlob(b64Data, contentType = "", sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: contentType });
  }

  async function copyImage(omitMessage) {
    const url = await domtoimage.toPng(contentNode, {
      bgColor: "transparent",
      scale: 3,
    });

    const blob = base64ToBlob(url.slice(url.indexOf(",") + 1), "image/png");
    const item = new ClipboardItem({ "image/png": blob });

    navigator.clipboard.write([item]);

    if (!omitMessage) {
      vscode.postMessage({ type: "copied" });
    }
  }

  async function downloadImage() {
    const data = await domtoimage.toPng(contentNode, {
      bgColor: "transparent",
      scale: 3,
    });

    vscode.postMessage({
      type: "download",
      data: data.slice(data.indexOf(",") + 1),
    });
  }

  async function composeTweet() {
    await copyImage(true);
    vscode.postMessage({ type: "tweet" });
  }

  document.addEventListener("paste", async (e) => {
    const html =
      e.clipboardData.getData("text/html") ||
      e.clipboardData.getData("text/plain");
    node.innerHTML = `<div id="code">${html}</div>`;

    const codeNode = document.getElementById("code");
    const lineHeight = codeNode.querySelector("div").style.lineHeight;

    const linesNode = document.getElementById("lines");
    const titleNode = document.getElementById("title");

    const { start, end, fileName, enableLogo } = window.__data__;

    titleNode.innerHTML = fileName;

    for (let i = start; i <= end + 1; i++) {
      const newNodeChild = document.createElement("span");
      newNodeChild.innerHTML = i;
      newNodeChild.style.lineHeight = lineHeight;
      linesNode.appendChild(newNodeChild);
    }

    containerNode.style.opacity = 1;
    containerNode.classList.add("bounce");

    if (enableLogo) {
      footer.style.display = "flex";
    }

    vscode.postMessage({ type: "end", data: {} });
  });

  document.execCommand("paste");
})();
