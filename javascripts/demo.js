// Here is our sample data. It is an array of objects with each element having a name property and a weapon or two.

var oData = [ { name: "Mr. Pink", guns: 1 }, { name: "Mr. Blonde", guns: 0, knives: 1 }, { name: "Mr. White", guns: 2 }, { name: "Mr. Orange", guns: 1 } ];

// This would be our sync function, our server would get the data from the
// database and then send it to the client ensuring that both server and client
// have the same initial data.

var sData = Tome.scribe(oData);
var cData = Tome.scribe(oData);

// We need a processing variable so that we know which context is performing
// the operation.

var processing;

// newLine is a function that we use to display the diffs, appending each diff
// with the context to the end of the log.

function newLine(source, text) {
	var dRepresentation = document.getElementById('dRepresentation');
	var output = document.createElement('span');
	output.textContent = '\u003C' + source + '\u003E ' + text;
	dRepresentation.appendChild(output);
	var dDiv = document.getElementById('dDiv');
	dDiv.scrollTop = dDiv.scrollHeight;
}

function contentLoaded() {

	// Now that our content is loaded we can start modifying the DOM.

	// First we fill in our textareas with some sample commands.

	var sTextarea = document.getElementById('sTextarea');
	var cTextarea = document.getElementById('cTextarea');

	sTextarea.textContent = 'sData[0].guns.inc(1);';
	cTextarea.textContent = 'cData.push({ name: \'Mr. Blue\', guns: 1 });\ncData[0].name.assign(\'Steve Buscemi\');';

	// Now wire up some click event handlers to handle executing our commands.

	var s2c = document.getElementById('s2c');
	s2c.addEventListener("click", function (e) {
		processing = 'sData';
		try {
			eval(sTextarea.value);
		} catch (error) {
			newLine(processing, error);
		}
		e.preventDefault();
		e.stopPropagation();
	}, false);

	var c2s = document.getElementById('c2s');
	c2s.addEventListener("click", function (e) {
		processing = 'cData';
		try {
			eval(cTextarea.value);
		} catch (error) {
			newLine(processing, error);
		}
		e.preventDefault();
		e.stopPropagation();
	}, false);

	// Now we wire up the log area to get the diffs that are generated by our
	// commands.

	sData.on('diff', function (JSONDiff) {
		if (processing === 'sData') {
			newLine(processing, JSON.stringify(JSONDiff));
			cData.consume(JSONDiff);
		}
	});

	cData.on('diff', function (JSONDiff) {
		if (processing === 'cData') {
			newLine(processing, JSON.stringify(JSONDiff));
			sData.consume(JSONDiff);
		}
	});

	// Now we wire up the string representations of our data to update when
	// changes are made.

	var sRepresentation = document.getElementById('sRepresentation');
	var cRepresentation = document.getElementById('cRepresentation');

	sData.on('signal', function (value) {
		sRepresentation.innerText = 'var sData = ' + JSON.stringify(value);
	});

	cData.on('signal', function (value) {
		cRepresentation.innerText = 'var cData = ' + JSON.stringify(value);
	});
}

// And finally we add an event listener to trigger our DOM modifications once
// the page is loaded and ready to be modified.

document.addEventListener("DOMContentLoaded", contentLoaded);