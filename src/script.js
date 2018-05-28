import { UnsplashPhoto } from 'unsplash-source-js';
import * as ICAL from 'ical.js';
import * as weatherRefObject from './weatherRef.json';

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
	mins = mins < 10 ? '0' + mins : mins;
	secs = secs < 10 ? '0' + secs : secs;
	document.getElementById('time').innerHTML = hour + ':' + mins + ':' + secs;
	if (chrome.i18n.getMessage("@@ui_locale") == 'fr') {
		document.getElementById('date').innerHTML = weekday + ' ' + day + ' ' + month + ' ' + year;
	} else {
		document.getElementById('date').innerHTML = weekday + ', ' + month + ' ' + day + ', ' + year;
	}
	var t = setTimeout(startTime, 500);
}

// Random quote function. Important: Make sure each quote has a corresponding "quoted".
function randomQuote() {
	var quotes = chrome.i18n.getMessage("quotes").split("/");
	var quoted = chrome.i18n.getMessage("quotesAuthors").split("/");
	var randNumQuotes = Math.floor((Math.random() * quotes.length));
	document.getElementById('quote').innerHTML = '&ldquo;' + quotes[randNumQuotes] + '&rdquo; &mdash; ' + '<small>' + quoted[randNumQuotes] + '</small>';
}

function randomBackground(time) { // daily, weekly, or every time
	var categories = ['buildings', /*'food',*/ 'nature', /*'people', 'technology',*/ 'objects'];
	var randomCategory = Math.floor((Math.random() * categories.length));
	var photo = new UnsplashPhoto();

	if (time == 'daily' || time == 'weekly')
		photo.all().randomize(time).fromCategory(categories[randomCategory]).fetch();
	else
		photo.all().fromCategory(categories[randomCategory]).fetch();

	document.body.style.backgroundImage = "url(" + photo.url + ")";
}

// Gets weather for requested location, appends to page
function getWeather(location) {
	var weatherLanguage = chrome.i18n.getMessage("@@ui_locale").substring(0, 2);
	var degUnit = displayFahrenheit ? 'F' : 'C';
	var YQLrequest = "select * from weather.forecast where woeid in (select woeid from geo.places(1) where text=\"(" + location + ")\") and u=\"" + degUnit + "\"";
	var YahooWeatherURL = "https://query.yahooapis.com/v1/public/yql?q=" + YQLrequest + "&format=json";

	var xmlhttp = new XMLHttpRequest();

	xmlhttp.open('GET', YahooWeatherURL, true);
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				var weather = JSON.parse(xmlhttp.responseText);

				var current_temperature = weather.query.results.channel.item.condition.temp;
				var current_conditionCode = weather.query.results.channel.item.condition.code;
				var forecast_conditionCode = weather.query.results.channel.item.forecast["0"].code;

				var current_weatherIcon = weatherRefObject[current_conditionCode].icon;

				var current_weatherCaption;
				var forecast_weatherCaption;

				if (chrome.i18n.getMessage("@@ui_locale") == 'fr') {
					current_weatherCaption = weatherRefObject[current_conditionCode].translation_fr;
					forecast_weatherCaption = "à venir : " + weatherRefObject[forecast_conditionCode].translation_fr;
				} else {
					current_weatherCaption = weatherRefObject[current_conditionCode].description;
					forecast_weatherCaption = "forecast : " + weatherRefObject[forecast_conditionCode].description;
				}

				if (displayPrecipitations == true) {
					var text_with_snow = ["snow"];
					var text_with_rain = ["sleet", "rain", "shower", "hail"];
					if (new RegExp(text_with_snow.join("|")).test(weather.query.results.channel.item.condition.text.toLowerCase())) {
						precipitate('snow');
					} else if (new RegExp(text_with_rain.join("|")).test(weather.query.results.channel.item.condition.text.toLowerCase()))
						precipitate('rain');
				}

				document.getElementById('weather').innerHTML = '<a id="weatherlink" href="' + weather.query.results.channel.item.link + '"><span class="climacon ' + current_weatherIcon + '"></span> ' + current_weatherCaption + ', ' + current_temperature + '&deg;' + degUnit + '</a>';
				document.getElementById('details').innerHTML = forecast_weatherCaption;
			}
		}
	};
	xmlhttp.send(null);
}

// Geolocates the user, otherwise defaulting to Lyon
function geolocWeather() {
	if ('geolocation' in navigator) {
		navigator.geolocation.getCurrentPosition(function (position) {
			getWeather(position.coords.latitude + ',' + position.coords.longitude);
		});

	} else {
		getWeather('45.7583, 4.8554');
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
		var distance = .05 + .95 * random;
		flake = {};
		flake.x = 1.5 * canvas.width * MyMath.random() - .5 * canvas.width;
		flake.y = -9;
		flake.velX = 2 * distance * (MyMath.random() / 2 + .5);
		flake.velY = (4 + 2 * MyMath.random()) * distance;
		flake.radius = MyMath.pow(5 * random, 2) / 5;
		flake.update = function () {
			var t = this;
			t.x += t.velX;
			t.y += t.velY;
			ctx.beginPath();
			ctx.arc(t.x, t.y, t.radius, 0, 2 * MyMath.PI, !1);
			if (type == 'snow')
				ctx.fillStyle = "#FFF";
			else if (type == 'rain')
				ctx.fillStyle = "#00F";
			ctx.fill()
		};
		flakeArray.push(flake);
		for (b = 0; b < flakeArray.length; b++) {
			flakeArray[b].y > canvas.height ? flakeArray.splice(b, 1) : flakeArray[b].update()
		}
	}, 16);
}

// Connects to Gmail and fetches unread message count
function gmailRequest() {
	var gmailURL = 'https://mail.google.com/mail/u/0/feed/atom',
		enteteMails = document.getElementById('mails'),
		menuMails = document.getElementById('mailsMenu'),
		xmlhttp = new XMLHttpRequest();
	xmlhttp.open('GET', gmailURL, true);
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				var parser = new DOMParser(),
					xmlDoc = parser.parseFromString(xmlhttp.responseText, 'application/xml'),
					email = xmlDoc.getElementsByTagName('title')[0].innerHTML.replace('Gmail - Inbox for ', ''),
					count = xmlDoc.getElementsByTagName('fullcount')[0].innerHTML,
					entries = xmlDoc.getElementsByTagName('entry'),
					entryList = email + ":\n",
					plural = (count > 1) ? ('s') : ('');

				if (entries.length == 0) {
					enteteMails.innerHTML = chrome.i18n.getMessage("noMail");
					enteteMails.href = "https://mail.google.com";
				} else {
					for (var i = 0; i < entries.length; i++) {
						var entryTitle = entries[i].getElementsByTagName('title')[0].innerHTML,
							authorName = entries[i].getElementsByTagName('author')[0].getElementsByTagName('name')[0].innerHTML,
							entryURL = entries[i].getElementsByTagName('link')[0].getAttribute('href');
						menuMails.innerHTML += '<li><a class="tab tab1" href="' + entryURL + '">' + entryTitle + ' - ' + authorName + '</a></li>';
					}
					if (chrome.i18n.getMessage("@@ui_locale") == 'fr') {
						enteteMails.innerHTML = count + " mail" + plural + " non lu" + plural;
					} else {
						enteteMails.innerHTML = count + " unread" + " mail" + plural;
					}
					enteteMails.href = "javascript:void(0)";
				}
				document.title = document.title + " - " + count + " mail" + plural;
			}
		}
	};
	xmlhttp.send(null);
}

// Lecture d'un flux RSS
function rssRequest(nomElement, url, title, nb) {
	var
		enteteRSS = document.getElementById(nomElement),
		menuRSS = document.getElementById(nomElement + 'Menu'),
		xmlhttp = new XMLHttpRequest();
	xmlhttp.open('GET', url, true);
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				var parser = new DOMParser(),
					xmlDoc = parser.parseFromString(xmlhttp.responseText, 'application/xml'),
					entries = xmlDoc.getElementsByTagName('item');

				if (entries.length == 0) {
					entries = xmlDoc.getElementsByTagName('entry');
				}

				if (title == '') {
					title = xmlDoc.getElementsByTagName('title')[0].childNodes[0].nodeValue;
				}

				enteteRSS.innerHTML = title;

				if (entries.length != 0) {
					for (var i = 0; i < Math.min(entries.length, nb); i++) {
						var entryTitle = entries[i].getElementsByTagName('title')[0].childNodes[0].nodeValue;
						try {
							entryContent = entries[i].getElementsByTagName('content')[0].childNodes[0].nodeValue;
							menuRSS.innerHTML += '<li><a class="tab" href="">' + entryContent + '</a></li>';
						} catch (err) {
							var entryURL = entries[i].getElementsByTagName('link')[0].childNodes[0].nodeValue;
							menuRSS.innerHTML += '<li><a class="tab" href="' + entryURL + '">' + entryTitle + '</a></li>';
						}
					}
				}
			}
		}
	};
	xmlhttp.send(null);
}

// Ouverture d'un calendrier google
function calendarRequest() {

	var
		enteteCalendar = document.getElementById('calendar'),
		menuCalendar = document.getElementById('calendarMenu'),
		xmlhttp = new XMLHttpRequest();
	xmlhttp.open('GET', calendarPrivateURL, true);
	xmlhttp.setRequestHeader("Authorization", "Basic " + btoa(calendarAndMailLogin + ":" + calendarAndMailPassword));
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				var jcalData = ICAL.parse(xmlhttp.responseText);
				var comp = new ICAL.Component(jcalData);
				var vevents = comp.getAllSubcomponents("vevent");
				var today = new Date()

				var events = vevents.map(function (e) {
					var event = new ICAL.Event(e);
					try {
						if (event.isRecurring()) {

							var recur = e.getFirstPropertyValue('rrule');
							var dtstart = e.getFirstPropertyValue('dtstart');
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
						e.summary = e.startDate.toLocaleDateString() + ' ' + e.startDate.toLocaleTimeString().substring(0, 5) + ' - ' + event.summary;
					} catch (err) {
						e.summary = chrome.i18n.getMessage("dateOccurrenceError");
					}
					if (e.startDate >= today) {
						return e;
					}
				});

				events.sort(function (a, b) {
					return (a.startDate > b.startDate) ? 1 : ((b.startDate > a.startDate) ? -1 : 0);
				});
				for (var i = 0; i < Math.min(events.length, 10); i++) {
					if (events[i]) {
						menuCalendar.innerHTML += '<li><a class="tab tab1" href="">' + events[i].summary + '</a></li>';
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
	cln.getElementsByClassName('parent')[0].id = "rss" + (nbFlux).toString();
	cln.getElementsByClassName('subMenu')[0].id = "rss" + (nbFlux).toString() + "Menu";
	// Ajout de cette div
	document.getElementById("right").appendChild(cln);
}


function restoreOptionsCalendarRSSRequest() {
	chrome.storage.sync.get({
		calendarPrivateURL: '',
		calendarAndMailLogin: '',
		calendarAndMailPassword: '',
		checkBoxUseIMAP: false,
		displayPrecipitations: true,
		displayFahrenheit: false,
		rssSources: [chrome.i18n.getMessage("optionsDefaultRSSURL")],
		rssTitles: [chrome.i18n.getMessage("optionsDefaultRSSTitle")],
		rssNbs: [5]
	}, function (items) {
		calendarPrivateURL = items.calendarPrivateURL;
		calendarAndMailLogin = items.calendarAndMailLogin;
		calendarAndMailPassword = items.calendarAndMailPassword;
		checkBoxUseIMAP = items.checkBoxUseIMAP;
		displayPrecipitations = items.displayPrecipitations;
		displayFahrenheit = items.displayFahrenheit;
		calendarRequest();
		geolocWeather();
		for (var i = 0; i < items.rssSources.length; i++) {
			if (i > 0) {
				add_rss();
			}
			rssRequest('rss' + i.toString(), items.rssSources[i], items.rssTitles[i], items.rssNbs[i]);
		}
		bindsClickEventsForOpeningTabs();
	});
}

function bindsClickEventsForOpeningTabs() {
	// Binds click events for opening tabs and background click to close
	var elements = document.querySelectorAll('.item');
	Array.prototype.forEach.call(elements, function (el, i) {
		el.addEventListener("click", function () {
			let parent = el.querySelector('.parent');
			let subMenu = el.querySelector('.subMenu');
			if (parent.classList.contains('active')) {
				parent.classList.remove('active');
				subMenu.classList.remove('slidedown');
				subMenu.classList.add('slideup');
			} else {
				parent.classList.add('active');
				subMenu.classList.remove('slideup');
				subMenu.classList.add('slidedown');
			}
		});
	});
}

function resetMousetraps() {
	// Binds click events for opening tabs and background click to close
	let parents = document.querySelectorAll('.parent');
	Array.prototype.forEach.call(parents, function (el, i) {
		el.classList.remove('active');
	});
	let subMenus = document.querySelectorAll('.subMenu');
	Array.prototype.forEach.call(subMenus, function (el, i) {
		el.classList.remove('slidedown');
		el.classList.add('slideup');
	});
}

// Initializes everything on page load

let calendarPrivateURL, calendarAndMailLogin, calendarAndMailPassword, checkBoxUseIMAP, displayPrecipitations, displayFahrenheit;

localizeHtmlPage();
startTime();
randomQuote();
randomBackground();
gmailRequest();

restoreOptionsCalendarRSSRequest();

// Binds click events to close cells and keyboard modal
document.getElementById('background').addEventListener('click', resetMousetraps, false);