//

// Finds current time and date, formats it properly
function startTime() {
  var monthNames = chrome.i18n.getMessage("monthNames").split("/");
  var dayNames = chrome.i18n.getMessage("dayNames").split("/");
  var now = new Date();
  var time = [now.getHours(), now.getMinutes(), now.getSeconds()];
  var date = [now.getDate(), now.getDay(), now.getMonth(), now.getFullYear()];
  var hour = time[0];
  var mins = time[1];
  var secs = time[2];
  var day = date[0];
  var weekday = dayNames[date[1]];
  var month = monthNames[date[2]];
  var year = date[3];
  mins = mins < 10 ? "0" + mins : mins;
  secs = secs < 10 ? "0" + secs : secs;
  document.getElementById("time").innerText = hour + ":" + mins + ":" + secs;
  if (chrome.i18n.getMessage("@@ui_locale") == "fr") {
    document.getElementById("date").innerText =
      weekday + " " + day + " " + month + " " + year;
  } else {
    document.getElementById("date").innerText =
      weekday + ", " + month + " " + day + ", " + year;
  }
  var t = setTimeout(startTime, 500);
}

// Random quote function. Important: Make sure each quote has a corresponding "quoted".
function randomQuote() {
  var quotes = chrome.i18n.getMessage("quotes").split("/");
  var quoted = chrome.i18n.getMessage("quotesAuthors").split("/");
  var randNumQuotes = Math.floor(Math.random() * quotes.length);
  document.getElementById("quote").innerHTML = DOMPurify.sanitize(
    "&ldquo;" +
      quotes[randNumQuotes] +
      "&rdquo; &mdash; " +
      "<small>" +
      quoted[randNumQuotes] +
      "</small>"
  );
}

function randomBackground(time) {
  // daily, weekly, or every time
  var categories = [
    "buildings",
    /*'food',*/ "nature",
    /*'people', 'technology',*/ "objects",
  ];
  var randomCategory = Math.floor(Math.random() * categories.length);
  var photo = new UnsplashPhoto();

  if (time == "daily" || time == "weekly")
    photo
      .all()
      .randomize(time)
      .fromCategory(categories[randomCategory])
      .fetch();
  else photo.all().fromCategory(categories[randomCategory]).fetch();

  document.body.style.backgroundImage = "url(" + photo.url + ")";
}

// Gets weather for requested location, appends to page
function getWeather(lat, long) {
  let apiKey = "204322f15d985e7ce1fa04d8ac7a717d";
  let weatherLanguage = chrome.i18n.getMessage("@@ui_locale");
  let degUnit = displayFahrenheit ? "F" : "C";
  let units = displayFahrenheit ? "imperial" : "metric";
  let openweathermapURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${long}&units=${units}&lang=${weatherLanguage}&appid=${apiKey}`;

  fetch(openweathermapURL, {})
    .then((response) => response.json())
    .then((weather) => {
      let current_temperature = Math.round(weather.list[0].main.temp);
      let current_weatherIcon =
        "http://openweathermap.org/img/w/" +
        weather.list[0].weather[0].icon +
        ".png";
      let current_weatherCaption = weather.list[0].weather[0].description;
      let forecast_weatherCaption = `${
        chrome.i18n.getMessage("@@ui_locale") == "fr"
          ? "à venir : "
          : "forecast : "
      }${weather.list[1].weather[0].description}`;

      if (displayPrecipitations == true) {
        let text_with_snow = ["snow"];
        let text_with_rain = ["sleet", "rain", "shower", "hail"];
        if (
          new RegExp(text_with_snow.join("|")).test(
            weather.list[0].weather[0].main.toLowerCase()
          )
        ) {
          precipitate("snow");
        } else if (
          new RegExp(text_with_rain.join("|")).test(
            weather.list[0].weather[0].main.toLowerCase()
          )
        )
          precipitate("rain");
      }

      document.getElementById("weather").innerHTML = DOMPurify.sanitize(
        `<img id="wicon" src="${current_weatherIcon}">${current_weatherCaption}, ${current_temperature} &deg;${degUnit}`
      );
      document.getElementById("details").innerText = forecast_weatherCaption;
    });
}

// Geolocates the user, otherwise defaulting to Lyon
function geolocWeather() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function (position) {
      getWeather(position.coords.latitude, position.coords.longitude);
    });
  } else {
    getWeather("45.7583", "4.8554");
  }
}

// Generate snow/rain with canvas tag
// https://github.com/HermannBjorgvin/SnowJs
function precipitate(type) {
  var canvas = document.getElementById("snow");
  var ctx = canvas.getContext("2d");
  var flakeArray = [];
  canvas.style.pointerEvents = "none";
  canvas.style.position = "fixed";
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";

  function canvasResize() {
    canvas.height = canvas.offsetHeight;
    canvas.width = canvas.offsetWidth;
  }
  canvasResize();
  window.onresize = function () {
    canvasResize();
  };
  var MyMath = Math;
  setInterval(function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    var random = MyMath.random();
    var distance = 0.05 + 0.95 * random;
    let flake = {};
    flake.x = 1.5 * canvas.width * MyMath.random() - 0.5 * canvas.width;
    flake.y = -9;
    flake.velX = 2 * distance * (MyMath.random() / 2 + 0.5);
    flake.velY = (4 + 2 * MyMath.random()) * distance;
    flake.radius = MyMath.pow(5 * random, 2) / 5;
    flake.update = function () {
      var t = this;
      t.x += t.velX;
      t.y += t.velY;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, 2 * MyMath.PI, !1);
      if (type == "snow") ctx.fillStyle = "#FFF";
      else if (type == "rain") ctx.fillStyle = "#00F";
      ctx.fill();
    };
    flakeArray.push(flake);
    for (let b = 0; b < flakeArray.length; b++) {
      flakeArray[b].y > canvas.height
        ? flakeArray.splice(b, 1)
        : flakeArray[b].update();
    }
  }, 16);
}

// Connects to Gmail and fetches unread message count
function gmailRequest() {
  var gmailURL = "https://mail.google.com/mail/u/0/feed/atom",
    enteteMails = document.getElementById("mails"),
    menuMails = document.getElementById("mailsMenu"),
    xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", gmailURL, true);
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4) {
      if (xmlhttp.status == 200) {
        var parser = new DOMParser(),
          xmlDoc = parser.parseFromString(
            xmlhttp.responseText,
            "application/xml"
          ),
          email = xmlDoc
            .getElementsByTagName("title")[0]
            .innerHTML.replace("Gmail - Inbox for ", ""),
          count = xmlDoc.getElementsByTagName("fullcount")[0].innerText,
          entries = xmlDoc.getElementsByTagName("entry"),
          entryList = email + ":\n",
          plural = count > 1 ? "s" : "";

        if (entries.length == 0) {
          enteteMails.innerText = chrome.i18n.getMessage("noMail");
          enteteMails.href = "https://mail.google.com";
        } else {
          for (var i = 0; i < entries.length; i++) {
            var entryTitle =
                entries[i].getElementsByTagName("title")[0].innerText,
              authorName = entries[i]
                .getElementsByTagName("author")[0]
                .getElementsByTagName("name")[0].innerText,
              entryURL = entries[i]
                .getElementsByTagName("link")[0]
                .getAttribute("href");
            menuMails.innerHTML += DOMPurify.sanitize(
              '<li><a class="tab tab1" href="' +
                entryURL +
                '">' +
                entryTitle +
                " - " +
                authorName +
                "</a></li>"
            );
          }
          if (chrome.i18n.getMessage("@@ui_locale") == "fr") {
            enteteMails.innerText =
              count + " mail" + plural + " non lu" + plural;
          } else {
            enteteMails.innerText = count + " unread" + " mail" + plural;
          }
          enteteMails.href = "javascript:void(0)";
        }
        document.title = document.title + " - " + count + " mail" + plural;
      }
    }
  };
  xmlhttp.send(null);
}

// Connects to SOGO Groupware
function sogoRequest() {
  fetch(sogoMailBoxURL, {
    method: "POST",
    body: { sortingAttributes: { sort: "arrival", asc: 0 } },
    credentials: "include",
  })
    .then((response) => {
      return response.json();
    })
    .then((mails) => {
      const enteteMails = document.getElementById("mails");
      const menuMails = document.getElementById("mailsMenu");
      mails.headers.splice(0, 1);
      const formattedMails = mails.headers.sort(function (a, b) {
        return (
          a[7].includes(":") && b[7].includes("-")
            ? 1
            : b[7].includes(":") && a[7].includes("-")
            ? -1
            : a[7] > b[7]
        )
          ? 1
          : b[7] > a[7]
          ? -1
          : 0;
      });
      const count = formattedMails.length;
      const plural = count > 1 ? "s" : "";

      if (count == 0) {
        enteteMails.innerText = chrome.i18n.getMessage("noMail");
        enteteMails.href = sogoMailBoxURL;
      } else {
        for (let i = 0; i < count; i++) {
          const entryTitle = formattedMails[i][3],
            author = formattedMails[i][4][0],
            entryDate = formattedMails[i][7];
          menuMails.innerHTML += DOMPurify.sanitize(
            '<li><a class="tab tab1">' +
              entryDate +
              " - " +
              entryTitle +
              " - " +
              author.name +
              "</a></li>"
          );
        }
        if (chrome.i18n.getMessage("@@ui_locale") == "fr") {
          enteteMails.innerText = count + " mail" + plural;
        } else {
          enteteMails.innerText = count + " mail" + plural;
        }
        enteteMails.href = "javascript:void(0)";
      }
      document.title = document.title + " - " + count + " mail" + plural;
    })
    .catch((err) => console.log(err));
}

// Lecture d'un flux RSS
function rssRequest(nomElement, url, title, nb) {
  var enteteRSS = document.getElementById(nomElement),
    menuRSS = document.getElementById(nomElement + "Menu"),
    xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", url, true);
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4) {
      if (xmlhttp.status == 200) {
        var parser = new DOMParser(),
          xmlDoc = parser.parseFromString(
            xmlhttp.responseText,
            "application/xml"
          ),
          entries = xmlDoc.getElementsByTagName("item");

        if (entries.length == 0) {
          entries = xmlDoc.getElementsByTagName("entry");
        }

        if (title == "") {
          title =
            xmlDoc.getElementsByTagName("title")[0].childNodes[0].nodeValue;
        }

        enteteRSS.innerText = title;

        if (entries.length != 0) {
          for (var i = 0; i < Math.min(entries.length, nb); i++) {
            var entryTitle =
              entries[i].getElementsByTagName("title")[0].childNodes[0]
                .nodeValue;
            try {
              entryContent =
                entries[i].getElementsByTagName("content")[0].childNodes[0]
                  .nodeValue;
              menuRSS.innerHTML += DOMPurify.sanitize(
                '<li><a class="tab" href="">' + entryContent + "</a></li>"
              );
            } catch (err) {
              var entryURL =
                entries[i].getElementsByTagName("link")[0].childNodes[0]
                  .nodeValue;
              menuRSS.innerHTML += DOMPurify.sanitize(
                '<li><a class="tab" href="' +
                  entryURL +
                  '">' +
                  entryTitle +
                  "</a></li>"
              );
            }
          }
        }
      }
    }
  };
  xmlhttp.send(null);
}

// Ouverture d'un calendrier
function calendarRequest() {
  var enteteCalendar = document.getElementById("calendar"),
    menuCalendar = document.getElementById("calendarMenu"),
    xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", calendarPrivateURL, true);
  xmlhttp.withCredentials = true;
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4) {
      if (xmlhttp.status == 200) {
        var jcalData = ICAL.parse(xmlhttp.responseText);
        var comp = new ICAL.Component(jcalData);
        var vevents = comp.getAllSubcomponents("vevent");
        var today = new Date();

        var events = vevents.map(function (e) {
          var event = new ICAL.Event(e);
          try {
            if (event.isRecurring()) {
              var recur = e.getFirstPropertyValue("rrule");
              var dtstart = e.getFirstPropertyValue("dtstart");
              var iter = recur.iterator(dtstart);
              var rangeStart = ICAL.Time.now();
              for (var next = iter.next(); next; next = iter.next()) {
                if (next.compare(rangeStart) < 0) {
                  continue;
                }
                break;
              }
              e.startDate = next.toJSDate();
            } else {
              e.startDate = event.startDate.toJSDate();
            }
            e.summary =
              e.startDate.toLocaleDateString() +
              " " +
              e.startDate.toLocaleTimeString().substring(0, 5) +
              " - " +
              event.summary;
          } catch (err) {
            e.summary = chrome.i18n.getMessage("dateOccurrenceError");
          }
          if (e.startDate >= today) {
            return e;
          }
        });

        events.sort(function (a, b) {
          return a.startDate > b.startDate
            ? 1
            : b.startDate > a.startDate
            ? -1
            : 0;
        });
        for (var i = 0; i < Math.min(events.length, 10); i++) {
          if (events[i]) {
            menuCalendar.innerHTML += DOMPurify.sanitize(
              '<li><a class="tab tab1" href="">' +
                events[i].summary +
                "</a></li>"
            );
          }
        }
      }
    }
  };
  xmlhttp.send(null);
}

function add_rss() {
  // Récupération de la ligne de la div rss0
  var itm = document.getElementById("rss0").parentElement;
  // Copie de cette div
  var cln = itm.cloneNode(true);
  var nbFlux = document.getElementById("right").childElementCount;
  cln.getElementsByClassName("parent")[0].id = "rss" + nbFlux.toString();
  cln.getElementsByClassName("subMenu")[0].id =
    "rss" + nbFlux.toString() + "Menu";
  // Ajout de cette div
  document.getElementById("right").appendChild(cln);
}

function restoreOptionsCalendarRSSRequest() {
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
    function (items) {
      calendarPrivateURL = items.calendarPrivateURL;
      checkBoxUseSOGO = items.checkBoxUseSOGO;
      sogoMailBoxURL = items.sogoMailBoxURL;
      if (sogoMailBoxURL !== "") {
        let sogoURL = new URL(sogoMailBoxURL);
        sogoAuthURL = "https://" + sogoURL.hostname + "/SOGo/connect";
        sogoDomain = sogoURL.hostname;
      }
      displayPrecipitations = items.displayPrecipitations;
      displayFahrenheit = items.displayFahrenheit;
      calendarRequest();
      geolocWeather();
      for (var i = 0; i < items.rssSources.length; i++) {
        if (i > 0) {
          add_rss();
        }
        rssRequest(
          "rss" + i.toString(),
          items.rssSources[i],
          items.rssTitles[i],
          items.rssNbs[i]
        );
      }
      bindsClickEventsForOpeningTabs();
      checkBoxUseSOGO ? sogoRequest() : gmailRequest();
    }
  );
}

function bindsClickEventsForOpeningTabs() {
  // Binds click events for opening tabs and background click to close
  var elements = document.querySelectorAll(".item");
  Array.prototype.forEach.call(elements, function (el, i) {
    el.addEventListener("click", function () {
      // Fold all submenus
      let subMenus = document.querySelectorAll(".slidedown");
      Array.prototype.forEach.call(subMenus, function (el, i) {
        el.classList.remove("slidedown");
        el.classList.add("slideup");
      });

      let parent = el.querySelector(".parent");
      let subMenu = el.querySelector(".subMenu");
      if (parent.classList.contains("active")) {
        parent.classList.remove("active");
      } else {
        let parents = document.querySelectorAll(".active");
        Array.prototype.forEach.call(parents, function (el, i) {
          el.classList.remove("active");
        });
        parent.classList.add("active");
        subMenu.classList.remove("slideup");
        subMenu.classList.add("slidedown");
      }
    });
  });
}

function resetMousetraps() {
  // Binds click events for opening tabs and background click to close
  let parents = document.querySelectorAll(".parent");
  Array.prototype.forEach.call(parents, function (el, i) {
    el.classList.remove("active");
  });
  let subMenus = document.querySelectorAll(".subMenu");
  Array.prototype.forEach.call(subMenus, function (el, i) {
    el.classList.remove("slidedown");
    el.classList.add("slideup");
  });
}

// Initializes everything on page load

let calendarPrivateURL,
  calendarAndMailPassword,
  checkBoxUseSOGO,
  sogoMailBoxURL,
  sogoAuthURL,
  sogoDomain,
  displayPrecipitations,
  displayFahrenheit;

document.addEventListener("DOMContentLoaded", function () {
  localizeHtmlPage();
  startTime();
  randomQuote();
  randomBackground();

  restoreOptionsCalendarRSSRequest();

  // Binds click events to close cells and keyboard modal
  document
    .getElementById("background")
    .addEventListener("click", resetMousetraps, false);
});
