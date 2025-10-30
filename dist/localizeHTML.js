const localizeHtmlPage = () => {
  const translatableElements = document.getElementsByClassName("translatable");

  for (const element of translatableElements) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const valStrH = node.nodeValue;
      const valNewH = valStrH.replace(/__MSG_(\w+)__/gi, (match, v1) => {
        return v1 ? chrome.i18n.getMessage(v1) : "";
      });
      if (valNewH !== valStrH) {
        node.nodeValue = valNewH;
      }
    }
  }
};
