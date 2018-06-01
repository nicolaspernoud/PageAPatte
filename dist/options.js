localizeHtmlPage();

// Saves options to chrome.storage.sync.
function save_options() {
	var calendarPrivateURL = document.getElementById('calendarPrivateURL').value;
	var calendarAndMailLogin = document.getElementById('calendarAndMailLogin').value;
	var calendarAndMailPassword = document.getElementById('calendarAndMailPassword').value;
	var sogoMailBoxURL = document.getElementById('sogoMailBoxURL').value;
	var checkBoxUseSOGO = document.getElementById('checkBoxUseSOGO').checked;
	var displayPrecipitations = document.getElementById('checkBoxPrecipitations').checked;
	var displayFahrenheit = document.getElementById('checkBoxFahrenheit').checked;

	var childDivs = document.getElementById('rsss').getElementsByTagName('div');
	var rssSources = [];
	var rssTitles = [];
	var rssNbs = [];

	for (var i = 0; i < childDivs.length; i++) {
		rssSources.push(childDivs[i].getElementsByClassName('rssSource')[0].value);
		rssTitles.push(childDivs[i].getElementsByClassName('rssTitle')[0].value);
		rssNbs.push(childDivs[i].getElementsByClassName('rssNb')[0].value);
	}

	chrome.storage.sync.set({
		calendarPrivateURL: calendarPrivateURL,
		calendarAndMailLogin: calendarAndMailLogin,
		calendarAndMailPassword: calendarAndMailPassword,
		sogoMailBoxURL: sogoMailBoxURL,
		checkBoxUseSOGO: checkBoxUseSOGO,
		displayPrecipitations: displayPrecipitations,
		displayFahrenheit: displayFahrenheit,
		rssSources: rssSources,
		rssTitles: rssTitles,
		rssNbs: rssNbs
	}, function () {
		// Update status to let user know options were saved.
		var status = document.getElementById('save');
		status.textContent = chrome.i18n.getMessage('optionsSaved');
		setTimeout(function () {
			status.textContent = chrome.i18n.getMessage('optionsSave');
		}, 1000);
	});

}

// Restores select box and checkbox state using the preferences stored in chrome.storage.
function restore_options() {
	chrome.storage.sync.get({
		calendarPrivateURL: '',
		calendarAndMailLogin: '',
		calendarAndMailPassword: '',
		sogoMailBoxURL: '',
		checkBoxUseSOGO: false,
		displayPrecipitations: true,
		displayFahrenheit: false,
		rssSources: [chrome.i18n.getMessage('optionsDefaultRSSURL')],
		rssTitles: [chrome.i18n.getMessage('optionsDefaultRSSTitle')],
		rssNbs: [5],
	}, function (items) {
		document.getElementById('calendarPrivateURL').value = items.calendarPrivateURL;
		document.getElementById('calendarAndMailLogin').value = items.calendarAndMailLogin;
		document.getElementById('calendarAndMailPassword').value = items.calendarAndMailPassword;
		document.getElementById('sogoMailBoxURL').value = items.sogoMailBoxURL;
		document.getElementById('checkBoxUseSOGO').checked = items.checkBoxUseSOGO;
		document.getElementById('checkBoxPrecipitations').checked = items.displayPrecipitations;
		document.getElementById('checkBoxFahrenheit').checked = items.displayFahrenheit;
		for (var i = 0; i < items.rssSources.length; i++) {
			if (i > 0) {
				add_flux();
			}
			var childDiv = document.getElementById('rsss').getElementsByTagName('div')[i];
			childDiv.getElementsByClassName('rssSource')[0].value = items.rssSources[i];
			childDiv.getElementsByClassName('rssTitle')[0].value = items.rssTitles[i];
			childDiv.getElementsByClassName('rssNb')[0].value = items.rssNbs[i];
		}
	});
}

function add_flux() {

	// Récupération de la div rss0
	var itm = document.getElementById('rss0');
	// Copie de cette div
	var cln = itm.cloneNode(true);
	var nbFlux = (document.getElementById('rsss').childElementCount).toString();
	cln.id = 'rss' + nbFlux;
	const button = cln.querySelector('.removeFlux');
	button.id = nbFlux;
	button.addEventListener('click', remove_flux);
	// Ajout de cette div
	document.getElementById('rsss').appendChild(cln);

}

function remove_flux(e) {
	const id = e.srcElement.id;
	if (document.getElementById('rsss').childElementCount > 1) {
		document.getElementById('rss' + id).remove();
	}
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('addFlux').addEventListener('click', add_flux);