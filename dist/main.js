const startTime = () => {
  const monthNames = chrome.i18n.getMessage("monthNames").split("/");
  const dayNames = chrome.i18n.getMessage("dayNames").split("/");
  const now = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()];
  const date = [now.getDate(), now.getDay(), now.getMonth(), now.getFullYear()];
  const hour = time[0];
  let mins = time[1];
  let secs = time[2];
  const day = date[0];
  const weekday = dayNames[date[1]];
  const month = monthNames[date[2]];
  const year = date[3];
  mins = mins < 10 ? `0${mins}` : mins;
  secs = secs < 10 ? `0${secs}` : secs;
  document.getElementById("time").innerText = `${hour}:${mins}:${secs}`;
  if (chrome.i18n.getMessage("@@ui_locale") === "fr") {
    document.getElementById("date").innerText = `${weekday} ${day} ${month} ${year}`;
  } else {
    document.getElementById("date").innerText = `${weekday}, ${month} ${day}, ${year}`;
  }
  setTimeout(startTime, 500);
};

const randomQuote = async () => {
  try {
    const response = await fetch("https://zenquotes.io/api/random");
    const data = await response.json();
    const quote = data[0].q;
    const author = data[0].a;
    document.getElementById("quote").innerHTML = DOMPurify.sanitize(
      `&ldquo;${quote}&rdquo; &mdash; <small>${author}</small>`
    );
  } catch (error) {
    console.error("Error fetching quote:", error);
    document.getElementById("quote").innerHTML = DOMPurify.sanitize(
      "&ldquo;The journey of a thousand miles begins with a single step.&rdquo; &mdash; <small>Lao Tzu</small>"
    );
  }
};

const randomBackground = () => {
  const { width, height } = screen;
  document.body.style.backgroundImage = `url(https://picsum.photos/${width}/${height})`;
};

const getWeather = async (lat, long) => {
  const apiKey = "204322f15d985e7ce1fa04d8ac7a717d";
  const weatherLanguage = chrome.i18n.getMessage("@@ui_locale");
  const degUnit = displayFahrenheit ? "F" : "C";
  const units = displayFahrenheit ? "imperial" : "metric";
  const openweathermapURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${long}&units=${units}&lang=${weatherLanguage}&appid=${apiKey}`;

  try {
    const response = await fetch(openweathermapURL);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching weather:", errorData.message);
      return;
    }
    const weather = await response.json();
    const current_temperature = Math.round(weather.list[0].main.temp);
    const current_weatherIcon = `http://openweathermap.org/img/w/${weather.list[0].weather[0].icon}.png`;
    const current_weatherCaption = weather.list[0].weather[0].description;
    const forecast_weatherCaption = `${
      chrome.i18n.getMessage("@@ui_locale") === "fr" ? "à venir : " : "forecast : "
    }${weather.list[1].weather[0].description}`;

    if (displayPrecipitations) {
      const text_with_snow = ["snow"];
      const text_with_rain = ["sleet", "rain", "shower", "hail"];
      if (new RegExp(text_with_snow.join("|")).test(weather.list[0].weather[0].main.toLowerCase())) {
        precipitate("snow");
      } else if (new RegExp(text_with_rain.join("|")).test(weather.list[0].weather[0].main.toLowerCase())) {
        precipitate("rain");
      }
    }

    document.getElementById("weather").innerHTML = DOMPurify.sanitize(
      `<img id="wicon" src="${current_weatherIcon}">${current_weatherCaption}, ${current_temperature} &deg;${degUnit}`
    );
    document.getElementById("details").innerText = forecast_weatherCaption;
  } catch (error) {
    console.error("Error fetching weather:", error);
  }
};

const geolocWeather = () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
      getWeather(position.coords.latitude, position.coords.longitude);
    });
  } else {
    getWeather(45.7583, 4.8554);
  }
};

const precipitate = (type) => {
  const canvas = document.getElementById("snow");
  const ctx = canvas.getContext("2d");
  const flakeArray = [];
  canvas.style.pointerEvents = "none";
  canvas.style.position = "fixed";
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";

  const canvasResize = () => {
    canvas.height = canvas.offsetHeight;
    canvas.width = canvas.offsetWidth;
  };
  canvasResize();
  window.onresize = canvasResize;

  setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    const random = Math.random();
    const distance = 0.05 + 0.95 * random;
    const flake = {
      x: 1.5 * canvas.width * Math.random() - 0.5 * canvas.width,
      y: -9,
      velX: 2 * distance * (Math.random() / 2 + 0.5),
      velY: (4 + 2 * Math.random()) * distance,
      radius: Math.pow(5 * random, 2) / 5,
      update() {
        this.x += this.velX;
        this.y += this.velY;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        if (type === "snow") ctx.fillStyle = "#FFF";
        else if (type === "rain") ctx.fillStyle = "#00F";
        ctx.fill();
      },
    };
    flakeArray.push(flake);
    for (let i = 0; i < flakeArray.length; i++) {
      if (flakeArray[i].y > canvas.height) {
        flakeArray.splice(i, 1);
      } else {
        flakeArray[i].update();
      }
    }
  }, 16);
};

const gmailRequest = async () => {
  const gmailURL = "https://mail.google.com/mail/u/0/feed/atom";
  const enteteMails = document.getElementById("mails");
  const menuMails = document.getElementById("mailsMenu");

  try {
    const response = await fetch(gmailURL);
    if (response.ok) {
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "application/xml");
      const email = xmlDoc.getElementsByTagName("title")[0].innerHTML.replace("Gmail - Inbox for ", "");
      const count = xmlDoc.getElementsByTagName("fullcount")[0].innerText;
      const entries = xmlDoc.getElementsByTagName("entry");
      const plural = count > 1 ? "s" : "";

      if (entries.length === 0) {
        enteteMails.innerText = chrome.i18n.getMessage("noMail");
        enteteMails.href = "https://mail.google.com";
      } else {
        for (const entry of entries) {
          const entryTitle = entry.getElementsByTagName("title")[0].innerText;
          const authorName = entry.getElementsByTagName("author")[0].getElementsByTagName("name")[0].innerText;
          const entryURL = entry.getElementsByTagName("link")[0].getAttribute("href");
          menuMails.innerHTML += DOMPurify.sanitize(
            `<li><a class="tab tab1" href="${entryURL}">${entryTitle} - ${authorName}</a></li>`
          );
        }
        if (chrome.i18n.getMessage("@@ui_locale") === "fr") {
          enteteMails.innerText = `${count} mail${plural} non lu${plural}`;
        } else {
          enteteMails.innerText = `${count} unread mail${plural}`;
        }
        enteteMails.href = "javascript:void(0)";
      }
      document.title = `${document.title} - ${count} mail${plural}`;
    }
  } catch (error) {
    console.error("Error fetching Gmail:", error);
  }
};

const sogoRequest = async () => {
  try {
    const response = await fetch(sogoMailBoxURL, {
      method: "POST",
      body: JSON.stringify({ sortingAttributes: { sort: "arrival", asc: 0 } }),
      credentials: "include",
    });
    const mails = await response.json();
    const enteteMails = document.getElementById("mails");
    const menuMails = document.getElementById("mailsMenu");
    mails.headers.splice(0, 1);
    const formattedMails = mails.headers.sort((a, b) => {
      if (a[7].includes(":") && b[7].includes("-")) return 1;
      if (b[7].includes(":") && a[7].includes("-")) return -1;
      if (a[7] > b[7]) return 1;
      if (b[7] > a[7]) return -1;
      return 0;
    });
    const count = formattedMails.length;
    const plural = count > 1 ? "s" : "";

    if (count === 0) {
      enteteMails.innerText = chrome.i18n.getMessage("noMail");
      enteteMails.href = sogoMailBoxURL;
    } else {
      for (const mail of formattedMails) {
        const entryTitle = mail[3];
        const author = mail[4][0];
        const entryDate = mail[7];
        menuMails.innerHTML += DOMPurify.sanitize(
          `<li><a class="tab tab1">${entryDate} - ${entryTitle} - ${author.name}</a></li>`
        );
      }
      if (chrome.i18n.getMessage("@@ui_locale") === "fr") {
        enteteMails.innerText = `${count} mail${plural}`;
      } else {
        enteteMails.innerText = `${count} mail${plural}`;
      }
      enteteMails.href = "javascript:void(0)";
    }
    document.title = `${document.title} - ${count} mail${plural}`;
  } catch (err) {
    console.log(err);
  }
};

const rssRequest = async (nomElement, url, title, nb) => {
  const enteteRSS = document.getElementById(nomElement);
  const menuRSS = document.getElementById(`${nomElement}Menu`);

  try {
    const response = await fetch(url);
    if (response.ok) {
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "application/xml");
      let entries = xmlDoc.getElementsByTagName("item");

      if (entries.length === 0) {
        entries = xmlDoc.getElementsByTagName("entry");
      }

      if (title === "") {
        title = xmlDoc.getElementsByTagName("title")[0].childNodes[0].nodeValue;
      }

      enteteRSS.innerText = title;

      if (entries.length !== 0) {
        for (let i = 0; i < Math.min(entries.length, nb); i++) {
          const entryTitle = entries[i].getElementsByTagName("title")[0].childNodes[0].nodeValue;
          try {
            const entryContent = entries[i].getElementsByTagName("content")[0].childNodes[0].nodeValue;
            menuRSS.innerHTML += DOMPurify.sanitize(
              `<li><a class="tab" href="">${entryContent}</a></li>`
            );
          } catch (err) {
            const entryURL = entries[i].getElementsByTagName("link")[0].childNodes[0].nodeValue;
            menuRSS.innerHTML += DOMPurify.sanitize(
              `<li><a class="tab" href="${entryURL}">${entryTitle}</a></li>`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching RSS:", error);
  }
};

const calendarRequest = async () => {
  const enteteCalendar = document.getElementById("calendar");
  const menuCalendar = document.getElementById("calendarMenu");

  try {
    const response = await fetch(calendarPrivateURL, { credentials: "include" });
    if (response.ok) {
      const text = await response.text();
      const jcalData = ICAL.parse(text);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents("vevent");
      const today = new Date();

      const events = vevents.map((e) => {
        const event = new ICAL.Event(e);
        try {
          if (event.isRecurring()) {
            const recur = e.getFirstPropertyValue("rrule");
            const dtstart = e.getFirstPropertyValue("dtstart");
            const iter = recur.iterator(dtstart);
            const rangeStart = ICAL.Time.now();
            let next;
            while ((next = iter.next()) && next.compare(rangeStart) < 0);
            e.startDate = next.toJSDate();
          } else {
            e.startDate = event.startDate.toJSDate();
          }
          e.summary = `${e.startDate.toLocaleDateString()} ${e.startDate.toLocaleTimeString().substring(0, 5)} - ${event.summary}`;
        } catch (err) {
          e.summary = chrome.i18n.getMessage("dateOccurrenceError");
        }
        if (e.startDate >= today) {
          return e;
        }
      });

      events.sort((a, b) => (a.startDate > b.startDate ? 1 : b.startDate > a.startDate ? -1 : 0));
      for (let i = 0; i < Math.min(events.length, 10); i++) {
        if (events[i]) {
          menuCalendar.innerHTML += DOMPurify.sanitize(
            `<li><a class="tab tab1" href="">${events[i].summary}</a></li>`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error fetching calendar:", error);
  }
};

const add_rss = () => {
  const itm = document.getElementById("rss0").parentElement;
  const cln = itm.cloneNode(true);
  const nbFlux = document.getElementById("right").childElementCount;
  cln.getElementsByClassName("parent")[0].id = `rss${nbFlux}`;
  cln.getElementsByClassName("subMenu")[0].id = `rss${nbFlux}Menu`;
  document.getElementById("right").appendChild(cln);
};

const restoreOptionsCalendarRSSRequest = () => {
  chrome.storage.sync.get(
    {
      calendarPrivateURL: "",
      checkBoxUseSOGO: false,
      sogoMailBoxURL: "",
      displayPrecipitations: true,
      displayFahrenheit: false,
      rssSources: [chrome.i18n.getMessage("optionsDefaultRSSURL")],
      rssTitles: [chrome.i18n.getMessage("optionsDefaultRSSTitle")],
      rssNbs: [5],
    },
    (items) => {
      calendarPrivateURL = items.calendarPrivateURL;
      checkBoxUseSOGO = items.checkBoxUseSOGO;
      sogoMailBoxURL = items.sogoMailBoxURL;
      if (sogoMailBoxURL !== "") {
        const sogoURL = new URL(sogoMailBoxURL);
        sogoAuthURL = `https://${sogoURL.hostname}/SOGo/connect`;
        sogoDomain = sogoURL.hostname;
      }
      displayPrecipitations = items.displayPrecipitations;
      displayFahrenheit = items.displayFahrenheit;
      calendarRequest();
      geolocWeather();
      for (let i = 0; i < items.rssSources.length; i++) {
        if (i > 0) {
          add_rss();
        }
        rssRequest(`rss${i}`, items.rssSources[i], items.rssTitles[i], items.rssNbs[i]);
      }
      bindsClickEventsForOpeningTabs();
      checkBoxUseSOGO ? sogoRequest() : gmailRequest();
    }
  );
};

const bindsClickEventsForOpeningTabs = () => {
  document.querySelectorAll(".item").forEach((el) => {
    el.addEventListener("click", () => {
      document.querySelectorAll(".slidedown").forEach((el) => {
        el.classList.remove("slidedown");
        el.classList.add("slideup");
      });

      const parent = el.querySelector(".parent");
      const subMenu = el.querySelector(".subMenu");
      if (parent.classList.contains("active")) {
        parent.classList.remove("active");
      } else {
        document.querySelectorAll(".active").forEach((el) => {
          el.classList.remove("active");
        });
        parent.classList.add("active");
        subMenu.classList.remove("slideup");
        subMenu.classList.add("slidedown");
      }
    });
  });
};

const resetMousetraps = () => {
  document.querySelectorAll(".parent").forEach((el) => {
    el.classList.remove("active");
  });
  document.querySelectorAll(".subMenu").forEach((el) => {
    el.classList.remove("slidedown");
    el.classList.add("slideup");
  });
};

let calendarPrivateURL,
  checkBoxUseSOGO,
  sogoMailBoxURL,
  sogoAuthURL,
  sogoDomain,
  displayPrecipitations,
  displayFahrenheit;

document.addEventListener("DOMContentLoaded", () => {
  localizeHtmlPage();
  startTime();
  randomQuote();
  randomBackground();
  restoreOptionsCalendarRSSRequest();
  document.getElementById("background").addEventListener("click", resetMousetraps, false);
});
