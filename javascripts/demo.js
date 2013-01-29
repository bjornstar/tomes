// Here is our sample data. It is an array of objects with each element having a name property and a weapon or two.

var oData = [ { name: "Mr. Pink", guns: 1 }, { name: "Mr. Blonde", guns: 0, knives: 1 }, { name: "Mr. White", guns: 2 }, { name: "Mr. Orange", guns: 1 } ];

// This would be our sync function, our server would get the data from the
// database and then send it to the client ensuring that both server and client
// have the same initial data.

var sData = Tome.conjure(oData);
var cData = Tome.conjure(oData);

// We need a processing variable so that we know which context is performing
// the operation.

var processing;

var sNeedsRender, cNeedsRender;

// newLine is a function that we use to display the diffs, appending each diff
// with the context to the end of the log.

function newLine(source, text) {
	var dRepresentation = document.getElementById('dRepresentation');
	var output = document.createElement('span');
	output.textContent = '\u003C' + source + '\u003E ' + text;
	dRepresentation.appendChild(output);
	dRepresentation.appendChild(document.createElement('br'));
	dRepresentation.scrollTop = dRepresentation.scrollHeight;
}

function sRender() {
	if (sNeedsRender) {
		var sRepresentation = document.getElementById('sRepresentation');
		sRepresentation.textContent = 'var sData = ' + JSON.stringify(sData);
		sRepresentation.scrollTop = sRepresentation.scrollHeight;
		sNeedsRender = false;
	}
}

function cRender() {
	if (cNeedsRender) {
		var cRepresentation = document.getElementById('cRepresentation');
		cRepresentation.textContent = 'var cData = ' + JSON.stringify(cData);
		cRepresentation.scrollTop = cRepresentation.scrollHeight;
		cNeedsRender = false;
	}
}

function sDataUpdate() {
	// cData has changed, we need to schedule an update, but only if we
	// haven't already scheduled one.
	if (processing === 'cData') {
		var diff = cData.read();

		if (diff) {
			newLine(processing, JSON.stringify(diff));
			sData.merge(diff);
			sData.read(); // clear the diffs from the merge
		}
	}

	cNeedsRender = true;
}

function cDataUpdate() {
	if (processing === 'sData') {
		var diff = sData.read();

		if (diff) {
			newLine(processing, JSON.stringify(diff));
			cData.merge(diff);
			cData.read(); // clear the diffs from the merge
		}

	}

	if (!sNeedsRender) {
		sNeedsRender = true;
		window.setTimeout(sRender, 200);
	}
}

function contentLoaded() {

	// Now that our content is loaded we can start modifying the DOM.

	// First we fill in our textareas with some sample commands.

	var sTextarea = document.getElementById('sTextarea');
	var cTextarea = document.getElementById('cTextarea');

	sTextarea.textContent = 'setInterval(function incGuns() { processing = \'sData\'; sData[0].guns.inc(Math.round(Math.random()*100)); }, 10);';
	cTextarea.textContent = 'cData.push({ name: \'Mr. Blue\', guns: 1 });\ncData[0].name.assign(\'Steve Buscemi\');';

	// Now wire up some click event handlers to handle executing our commands.

	var s2c = document.getElementById('s2c');
	s2c.addEventListener("click", function handleS2C(e) {
		processing = 'sData';
		try {
			eval(sTextarea.value);
			cDataUpdate(); // make sure this data gets consumed immediately.
		} catch (error) {
			newLine(processing, error);
		}
		e.preventDefault();
		e.stopPropagation();
	}, false);

	var c2s = document.getElementById('c2s');
	c2s.addEventListener("click", function handleC2S(e) {
		processing = 'cData';
		try {
			eval(cTextarea.value);
			sDataUpdate(); // make sure this data gets consumed immediately.
		} catch (error) {
			newLine(processing, error);
		}
		e.preventDefault();
		e.stopPropagation();
	}, false);

	// Now we wire up the data processors and render functions.

	cData.on('readable', sDataUpdate);
	sData.on('readable', cDataUpdate);

	cNeedsRender = true;
	sNeedsRender = true;
	sRender();
	cRender();

	window.setInterval(cRender, 1000);
}

// And finally we add an event listener to trigger our DOM modifications once
// the page is loaded and ready to be modified.

document.addEventListener("DOMContentLoaded", contentLoaded);

