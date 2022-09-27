
(function () {
  const vscode = acquireVsCodeApi();
  const node = document.getElementById("output");

  const copyButton = document.querySelector("#copy");
  const tweetButton = document.querySelector("#tweet");
  const beerButton = document.querySelector("#beer");

  const downloadButton = document.querySelector("#download");
  const footer = document.querySelector("#footer");

  copyButton.addEventListener("click", () => copyImage(false));
  downloadButton.addEventListener("click", downloadImage);
  tweetButton.addEventListener("click", composeTweet);
  beerButton.addEventListener("click", buyMeABeer);

  const contentNode = document.getElementById("content");
  const containerNode = document.getElementById("container");

  function base64ToBlob(b64Data, contentType = "", sliceSize = 1024) {
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
    const { scale } = window.__data__;
  
    const url = await domtoimage.toPng(contentNode, {
      bgColor: "transparent",
      scale: Math.min(4, Math.max(1, scale || 0)),
    });

    const blob = base64ToBlob(url.slice(url.indexOf(",") + 1), "image/png");
    const item = new ClipboardItem({ "image/png": blob });

    navigator.clipboard.write([item]);

    if (!omitMessage) {
      vscode.postMessage({ type: "copied" });
    }

    containerNode.classList.add("bounce");
  }

  async function toSvg() {
    const data = await domtoimage.toSvg(contentNode);
    return data.replace(/%0A/g, "\n").replace(/%23/g, "#").replace(/%25/g, "%");
  }

  async function downloadImage() {
    const { enablePng, scale } = window.__data__;

    const data = enablePng
      ? await domtoimage.toPng(contentNode, {
          bgColor: "transparent",
          scale: Math.min(4, Math.max(1, scale || 0)),
        })
      : await toSvg();

    containerNode.classList.add("bounce");

    vscode.postMessage({
      type: "download",
      data: data.slice(data.indexOf(",") + 1),
    });
  }

  async function composeTweet() {
    await copyImage(true);
    vscode.postMessage({ type: "tweet" });
  }

  function buyMeABeer() {
    vscode.postMessage({ type: "beer" });
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

    const { start, end, fileName, enableLogo, autoCopy } = window.__data__;

    titleNode.innerHTML = fileName;

    for (let i = start; i <= end + 1; i++) {
      const newNodeChild = document.createElement("span");
      newNodeChild.innerHTML = i;
      newNodeChild.style.lineHeight = lineHeight;
      linesNode.appendChild(newNodeChild);
    }

    containerNode.style.opacity = 1;

    if (enableLogo) {
      footer.style.display = "flex";
    }

    if (autoCopy) {
      setTimeout(() => copyImage(), 200);
    } else {
      vscode.postMessage({ type: "end", data: {} });
    }
  });

  setTimeout(() => {
    document.execCommand("paste");
  }, 200);
})();
