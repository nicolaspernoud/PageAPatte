localizeHtmlPage();

const saveOptions = () => {
  const calendarPrivateURL = document.getElementById("calendarPrivateURL").value;
  const sogoMailBoxURL = document.getElementById("sogoMailBoxURL").value;
  const checkBoxUseSOGO = document.getElementById("checkBoxUseSOGO").checked;
  const displayPrecipitations = document.getElementById("checkBoxPrecipitations").checked;
  const displayFahrenheit = document.getElementById("checkBoxFahrenheit").checked;

  const childDivs = document.getElementById("rsss").getElementsByTagName("div");
  const rssSources = [];
  const rssTitles = [];
  const rssNbs = [];

  for (const div of childDivs) {
    rssSources.push(div.getElementsByClassName("rssSource")[0].value);
    rssTitles.push(div.getElementsByClassName("rssTitle")[0].value);
    rssNbs.push(div.getElementsByClassName("rssNb")[0].value);
  }

  chrome.storage.sync.set({
    calendarPrivateURL,
    sogoMailBoxURL,
    checkBoxUseSOGO,
    displayPrecipitations,
    displayFahrenheit,
    rssSources,
    rssTitles,
    rssNbs,
  }, () => {
    const status = document.getElementById("save");
    status.textContent = chrome.i18n.getMessage("optionsSaved");
    setTimeout(() => {
      status.textContent = chrome.i18n.getMessage("optionsSave");
    }, 1000);
  });
};

const restoreOptions = () => {
  chrome.storage.sync.get({
    calendarPrivateURL: "",
    sogoMailBoxURL: "",
    checkBoxUseSOGO: false,
    displayPrecipitations: true,
    displayFahrenheit: false,
    rssSources: [chrome.i18n.getMessage("optionsDefaultRSSURL")],
    rssTitles: [chrome.i18n.getMessage("optionsDefaultRSSTitle")],
    rssNbs: [5],
  }, (items) => {
    document.getElementById("calendarPrivateURL").value = items.calendarPrivateURL;
    document.getElementById("sogoMailBoxURL").value = items.sogoMailBoxURL;
    document.getElementById("checkBoxUseSOGO").checked = items.checkBoxUseSOGO;
    document.getElementById("checkBoxPrecipitations").checked = items.displayPrecipitations;
    document.getElementById("checkBoxFahrenheit").checked = items.displayFahrenheit;
    for (let i = 0; i < items.rssSources.length; i++) {
      if (i > 0) {
        addFlux();
      }
      const childDiv = document.getElementById("rsss").getElementsByTagName("div")[i];
      childDiv.getElementsByClassName("rssSource")[0].value = items.rssSources[i];
      childDiv.getElementsByClassName("rssTitle")[0].value = items.rssTitles[i];
      childDiv.getElementsByClassName("rssNb")[0].value = items.rssNbs[i];
    }
  });
};

const addFlux = () => {
  const itm = document.getElementById("rss0");
  const cln = itm.cloneNode(true);
  const nbFlux = document.getElementById("rsss").childElementCount.toString();
  cln.id = `rss${nbFlux}`;
  const button = cln.querySelector(".removeFlux");
  button.id = nbFlux;
  button.addEventListener("click", removeFlux);
  document.getElementById("rsss").appendChild(cln);
};

const removeFlux = (e) => {
  const id = e.srcElement.id;
  if (document.getElementById("rsss").childElementCount > 1) {
    document.getElementById(`rss${id}`).remove();
  }
};

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
document.getElementById("addFlux").addEventListener("click", addFlux);
