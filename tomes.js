if (typeof require === 'function') {
	var EventEmitter = require('events') ? require('events').EventEmitter : EventEmitter;
	var inherits = require('util') ? require('util').inherits : inherits;
}

var exports = exports || {};
var isArray = Array.isArray;

//  ________
// |        \
//  \$$$$$$$$______   ______ ____    ______    _______
//    | $$  /      \ |      \    \  /      \  /       \
//    | $$ |  $$$$$$\| $$$$$$\$$$$\|  $$$$$$\|  $$$$$$$
//    | $$ | $$  | $$| $$ | $$ | $$| $$    $$ \$$    \
//    | $$ | $$__/ $$| $$ | $$ | $$| $$$$$$$$ _\$$$$$$\
//    | $$  \$$    $$| $$ | $$ | $$ \$$     \|       $$
//     \$$   \$$$$$$  \$$  \$$  \$$  \$$$$$$$ \$$$$$$$


function Tome(parent, key) {

	// The Tome type holds references and methods that all 'real' types inherit.
	// We should never get an object that is just a Tome, it should always be
	// at least one other type ie. a NumberTome is a ScalarTome and a Tome. We
	// call this function in the constructor of each Tome type.

	// __parent__ holds a reference to the Tome's parent object so we can signal
	// up the Tome chain.

	// __batch__ is our indicator that we will only emit signal events once we
	// are finished with all our changes. We set this to true in the startBatch
	// method and then set it to false in the endBatch method which follows it
	// up with calling the notify method that signals all changed Tomes.

	if (parent instanceof Tome) {
		Object.defineProperty(this, '__parent__', { writable: true, value: parent });
	} else {
		Object.defineProperty(this, '__batch__', { writable: true, value: false });
	}

	if (key !== undefined) {
		Object.defineProperty(this, '__key__', { writable: true, value: key });
	}

	// __root__ holds a reference to the Tome at the top of the chain. We use it
	// to batch signals when we perform operations that would cause a Tome to
	// signal multiple times, ie. consuming diffs.

	Object.defineProperty(this, '__root__', { value: parent instanceof Tome ? parent.__root__ : this });

	// __diff__ is our indicator that while we are in batch mode this object
	// had changes and needs to emit signal events once we are finished with
	// all our changes. This gets is modified in the diff method and set to
	// undefined in the notify method once we emit the signal and diff event.

	Object.defineProperty(this, '__diff__', { writable: true });

	// If you're using the node.js event emitter, we need to make the _events
	// non-enumerable. Ideally, node.js would make this the default behavior.

	Object.defineProperty(this, '_events', { configurable: true, writable: true });

	// When we add a signal listener, we emit once with the current value. This
	// is helpful when setting up UI components. We shouldn't have to create
	// separate logic for initial values and value changes.

	this.on('newListener', function (eventName, listener) {
		if (eventName === 'signal') {
			listener.call(this, this.valueOf());
		}
	});
}

function ArrayTome(val, parent, key) {
	Tome.call(this, parent, key);
	this.init(val);
}

function ObjectTome(val, parent, key) {
	Tome.call(this, parent, key);
	this.init(val);
}

function ScalarTome(val, parent, key) {
	Tome.call(this, parent, key);
	this.init(val);
}

function BooleanTome() {
	ScalarTome.apply(this, arguments);
}

function NullTome() {
	Tome.apply(this, arguments);
}

function NumberTome() {
	ScalarTome.apply(this, arguments);
}

function StringTome() {
	ScalarTome.apply(this, arguments);
}

function UndefinedTome() {
	Tome.apply(this, arguments);
}

inherits(Tome, EventEmitter);

// Every Tome is an EventEmitter, we can listen for four different events:
//
//  -     add: Emitted when a Tome receives a new property. Emits the key and
//             the value of the property added. This event is only emitted on
//             the Tome that received a new property and does not traverse up
//             the Tome chain. An add event is always accompanied by a signal
//             that does traverse up the Tome chain.
//
//  -     del: Emitted when deleting a property from a Tome. Emits the key of
//             the property that was deleted. This event is only emitted on the
//             Tome whose property was deleted and does not traverse up the Tome
//             chain. A del event is always accompanied by a signal event that
//             does traverse up the Tome chain. Additionally, the Tome that was
//             deleted and all of it's children will also emit a destroy event.
//
//  - destroy: Emitted when a Tome has been deleted. We use this to tell all
//             interested parties that the Tome no longer exists and will not
//             emit any more events.
//
//  -  signal: Emitted when a Tome is modified. This is our bread and butter
//             event. A signal is emitted by a Tome when it or any of its child
//             Tomes change. It is also emitted when we register an event
//             listener for the signal event. When an operation occurs that
//             changes multiple children of a Tome, we only emit signal once.
//
//  -    diff: Emitted when a Tome is modified. A diff is emitted by a Tome
//             when it or any of its child Tomes change. This diff is used by
//             by Tomes operating in different environments to stay in sync.


exports.Tome = Tome;

Tome.isTome = function (o) {
	return o instanceof Tome;
};

Tome.typeOf = function (v) {

	// We use this function to identify a value's data type. We pay special
	// attention to array and null as JavaScript currently considers these
	// objects. This also works on Tomes.

	if (isArray(v)) {
		return 'array';
	}

	if (v === null) {
		return 'null';
	}

	if (v instanceof Tome) {
		return v.typeOf();
	}

	return typeof v;
};

Tome.protoOf = function (t) {
	var prototypeMap = {
		"array": ArrayTome.prototype,
		"boolean": BooleanTome.prototype,
		"null": NullTome.prototype,
		"number": NumberTome.prototype,
		"object": ObjectTome.prototype,
		"string": StringTome.prototype,
		"undefined": UndefinedTome.prototype
	};
	return prototypeMap[t];
};

Tome.conjure = function (val, parent, key) {

	// We instantiate a new Tome object by using the Tome.conjure method.
	// It will return a new Tome of the appropriate type for our value with Tome
	// inherited. This is also how we pass parent into our Tome so we can signal
	// a parent that its child has been modified.

	var vType = Tome.typeOf(val);

	switch (vType) {
	case 'array':
		return new ArrayTome(val, parent, key);
	case 'boolean':
		return new BooleanTome(val, parent, key);
	case 'null':
		return new NullTome(parent, key);
	case 'number':
		return new NumberTome(val, parent, key);
	case 'string':
		return new StringTome(val, parent, key);
	case 'object':
		return new ObjectTome(val, parent, key);
	case 'undefined':

		// UndefinedTomes only exist in the context of Arrays because they JSON
		// stringify to null when in arrays.

		if (Tome.typeOf(parent) === 'array') {
			return new UndefinedTome(parent, key);
		}
		return;
	default:

		// If the value's type is not supported, complain loudly.

		throw new TypeError('Tome.conjure - Invalid value type: ' + vType);
	}
};

Tome.prototype.set = function (key, val) {

	// We use this to set a property on a Tome to the specified value. This can
	// either be a new property in which case we'd emit add and signal, or we
	// assign a new value to an existing value, destroying the old value.

	// If we try to assign an undefined value to a property, it will only have
	// an effect on ObjectTomes, otherwise it will do nothing.

	var diff;

	if (Tome.typeOf(val) === 'undefined') {
		if (this instanceof ObjectTome) {
			this[key] = undefined;
			diff = {};
			diff[key] = val;
			this.diff('set', diff);
		}
		return undefined;
	}

	if (!(this instanceof ObjectTome)) {

		// Only ObjectTomes can have properties, therefore we reset the Tome to
		// the Tome type and then turn it into an ObjectTome. ArrayTome has its
		// own set method which falls through to this one if the key is not a
		// number.

		this.reset();
		this.__proto__ = ObjectTome.prototype;
	}

	if (!this.hasOwnProperty(key)) {

		// This is a new property, we conjure a new Tome with a type based on
		// the type of the value and assign it to the property. Then we emit an
		// add event followed by a signal which goes up the Tome chain.

		this[key] = Tome.conjure(val, this, key);
		this.emit('add', key, this[key].valueOf());
		diff = {};
		diff[key] = val;
		this.diff('set', diff);

		// We've already assigned the value to the property so we return this.

		return this.valueOf();
	}

	var p = this[key];

	if (p === undefined) {

		// This property exists, but has undefined as its value. We need to
		// conjure a Tome to assign a value to it.

		this[key] = Tome.conjure(val, this, key);
		diff = {};
		diff[key] = val;
		this.diff('set', diff);

		// We've already assigned the value to the property so we return this.

		return this[key].valueOf();
	}

	if (!(p instanceof Tome)) {

		// If this key is not a Tome, complain loudly.

		throw new TypeError('Tome.set - Key is not a Tome: ' + key);
	}

	// And finally, assign the value to the property. This will make sure the
	// property is the correct type for the value and emit the signal event.

	p.assign(val);

	return this[key].valueOf();
};

Tome.prototype.assign = function (val) {

	// This is where the magic happens.

	// First we need to get the type of the value and the type of the Tome to
	// ensure we match the Tome type to the value type.

	var vType = Tome.typeOf(val);
	var vProto = Tome.protoOf(vType);
	var pType = this.typeOf();

	if (vProto === undefined) {
		throw new TypeError('Tome.assign - Invalid value type: ' + vType);
	}

	if (vType === 'undefined' && (!this.hasOwnProperty('__parent__') || this.__parent__.typeOf() !== 'array')) {
		throw new TypeError('Tome.assign - You can only assign undefined to ArrayTome elements');
	}

	if (vType === pType && this instanceof ScalarTome) {

		// The simplest case is scalar types: boolean, number, and string. If
		// we already have the correct Tome type we assign the value, signal,
		// and return our new value.

		this._val = val.valueOf();
		this.diff('assign', val.valueOf());
		return this.valueOf();
	}

	// We reset the Tome type back to the base Tome to ensure we're clean.

	this.reset();

	// Now we need to apply a new Tome type based on the value type.

	this.__proto__ = vProto;
	this.init(val ? val.valueOf() : val);

	this.diff('assign', val);

	return this.valueOf();
};

Tome.prototype.notify = function () {

	// The notify method is called on the root Tome by endBatch to emit signal
	// and diff on all Tomes that need to. We know a Tome needs to emit because
	// its __diff__ property was set by the diff method.

	if (this.__diff__ === undefined) {
		return;
	}

	this.emit('signal', this.valueOf());
	this.emit('diff', this.__diff__);
	this.__diff__ = undefined;

	// Since our Tomes inherit from multiple prototypes, they have a large
	// number of properties. We use Object.keys to only get its own enumerable
	// properties, this is much faster than using for ... in which would
	// iterate over all properties in the prototype chain.

	var keys = Object.keys(this);
	for (var i = 0, len = keys.length; i < len; i += 1) {
		var k = keys[i];
		if (this[k] !== undefined && this[k].__diff__ !== undefined) {
			this[k].notify();
		}
	}
};

Tome.prototype.startBatch = function () {

	// startBatch enables batch mode for signal emission. We need this so that
	// we only emit signal once per object even if there were multiple changes
	// on its child Tomes. Whenever you call startBatch, you must call endBatch
	// to perform signal emission.

	this.__root__.__batch__ = true;
};

Tome.prototype.endBatch = function () {

	// endBatch disables batch mode for signal emission and calls the notify
	// method to trigger signal emission on all child Tomes that need to signal.

	this.__root__.__batch__ = false;
	this.__root__.notify();
};

Tome.prototype.destroy = function () {

	// When a Tome is deleted we emit a destroy event on it and all of its child
	// Tomes since they will no longer exist. We go down the Tome chain first and
	// then emit our way up.

	for (var key in this) {
		if (this.hasOwnProperty(key) && this[key] instanceof Tome) {
			this[key].destroy();
		}
	}
	this.emit('destroy');
};

Tome.prototype.del = function (key) {

	// The del method is used to delete a property from a Tome. The key must
	// exist and be a Tome. The Tome will emit a del event with the name of the
	// property that was deleted and destory will be emitted by the property
	// that was deleted as well as all of its child Tomes. Finally, the Tome will
	// also signal that it was changed which also signals all the way up the
	// Tome chain.

	if (!this.hasOwnProperty(key)) {
		throw new ReferenceError('Tome.del - Key is not defined: ' + key);
	}

	if (!this[key] instanceof Tome) {
		throw new TypeError('Tome.del - Key is not a Tome: ' + key);
	}

	var o = this[key];

	delete this[key];

	if (o instanceof Tome) {
		o.destroy();
	}

	this.emit('del', key);
	this.diff('del', key);
};

Tome.prototype.reset = function () {

	// The reset method deletes all properties on a Tome and turns it back into
	// a base Tome with no real type. We should immediately assign it a new type
	// based on the value.

	delete this._arr;
	delete this.length;
	delete this._val;

	var keys = Object.keys(this);
	var len = keys.length;
	var key, i, o;

	// Here we delete all of the properties and emit destroy on all of their
	// child Tomes. For destroy we don't really care about the order of events.
	// All that matters is that a Tome got destroyed.

	for (i = 0; i < len; i += 1) {
		key = keys[i];
		if (this[key] instanceof Tome) {
			o = this[key];
			delete this[key];
			o.destroy();
		}
	}

	// Once we have deleted all of the properties we emit del for each of the
	// deleted properties. We use this order so that when we emit del the
	// properties have already been deleted.

	for (i = 0; i < len; i += 1) {
		key = keys[i];
		this.emit('del', key);
		//this.diff('del', key);
	}
};

Tome.prototype.toJSON = function () {

	// The toJSON method is automatically used by JSON.stringify to turn a Tome
	// into a string. All Tome types except for the UndefinedTome type use
	// valueOf when they are stringified. UndefinedTome has its own toJSON
	// method that returns null, this is because undefined elements in arrays
	// stringify to null.

	return this.valueOf();
};

Tome.prototype.diff = function (op, val, chain) {

	// op, val is the actual diff that triggered the diff event, chain holds
	// the path and grows as we traverse up to the root.

	if (chain === undefined) {
		chain = {};
		chain[op] = val;
	}

	var diff = this.__diff__;

	if (diff === undefined) {
		diff = {};
	}

	for (var k in chain) {
		if (diff.hasOwnProperty(k)) {
			if (Tome.typeOf(diff[k]) === 'array') {
				diff[k].push(chain[k]);
			} else {
				var first = diff[k];
				diff[k] = [ first, chain[k]];
			}
		} else {
			diff[k] = chain[k];
		}
	}

	if (!this.__root__.__batch__) {
		this.emit('signal', this.valueOf());
		this.emit('diff', diff);
	} else {
		this.__diff__ = diff;
	}

	// Now we need to build a bigger object to send to the parent.

	var link = {};

	if (this.hasOwnProperty('__key__')) {
		// We aren't on the root Tome, so we have a key, stick that on the
		// chain
		link['_' + this.__key__] = chain;
	}

	if (this.hasOwnProperty('__parent__') && this.__parent__ instanceof Tome) {
		this.__parent__.diff(op, val, link);
	}
};

Tome.prototype.batch = function (diff) {

	// The batch method takes an object and assigns new values to the Tome based
	// on the object. It enables batch mode through startBatch, applies the new
	// values using the consume method, then calls endBatch to disable batch
	// mode and signal on the Tomes that were changed.

	this.startBatch();
	if (Tome.typeOf(diff) === 'array') {
		for (var i = 0, len = diff.length; i < len; i += 1) {
			this.consume(diff[i]);
		}
	} else {
		this.consume(diff);
	}
	this.endBatch();
};

Tome.prototype.consume = function (diff) {
	for (var key in diff) {
		var val = diff[key];
		switch (key) {
		case 'set':
			for (var k in val) {
				this.set(k, val[k]);
			}
			break;
		case 'assign':
			this.assign(val);
			break;
		default:
			if (key.indexOf('_') === 0) {
				var child = key.substring(1);
				if (this.hasOwnProperty(child)) {
					this[child].consume(val);
				} else {
					throw new ReferenceError('Tome.consume - key is not defined: ' + child);
				}
			} else {
				throw new Error('Tome.consume - Invalid operation: ', key);
			}
		}
	}
};


//   ______
//  /      \
// |  $$$$$$\  ______    ______   ______   __    __
// | $$__| $$ /      \  /      \ |      \ |  \  |  \
// | $$    $$|  $$$$$$\|  $$$$$$\ \$$$$$$\| $$  | $$
// | $$$$$$$$| $$   \$$| $$   \$$/      $$| $$  | $$
// | $$  | $$| $$      | $$     |  $$$$$$$| $$__/ $$
// | $$  | $$| $$      | $$      \$$    $$ \$$    $$
//  \$$   \$$ \$$       \$$       \$$$$$$$ _\$$$$$$$
//                                        |  \__| $$
//                                         \$$    $$
//                                          \$$$$$$


inherits(ArrayTome, Tome);

exports.ArrayTome = ArrayTome;

ArrayTome.isArrayTome = function (o) {
	return o instanceof ArrayTome;
};

ArrayTome.prototype.init = function (val) {

	// An ArrayTome has two non-enumerable properties:
	//  -   _arr: Holds the actual array that we reference.
	//  - length: Holds the length of the array in _arr.

	Object.defineProperty(this, '_arr', { configurable: true, writable: true });
	Object.defineProperty(this, 'length', { configurable: true, writable: true });

	// val is an array so we take its length and instantiate a new array of
	// the appropriate size in _arr. We already know the length so we
	// assign that as well.

	var len = val.length;
	this._arr = new Array(len);
	this.length = len;

	// We go through each element in val and conjure a new Tome based on that
	// value with a reference to this as its parent. We also assign
	// properties with references to those new array elements. We need this
	// so we can do things like myTome[3].on('signal', function () {});

	// One additional special case that bears mentioning here is when an
	// array element has undefined as its value. When that element goes
	// through JSON.stringify it turns into null. We handle that by having
	// an UndefinedTome type and making its toJSON method return null. Also,
	// that element does not show up in hasOwnProperty, so we do not assign
	// a property for that element.

	for (var i = 0; i < len; i += 1) {
		this._arr[i] = Tome.conjure(val[i], this, i);
		
		// We use hasOwnProperty here because arrays instantiated with new
		// have elements, but no keys ie. new Array(1) is different from
		// [undefined].

		if (val.hasOwnProperty(i)) {
			this[i] = this._arr[i];
		}
	}

	for (i = 0; i < len; i += 1) {

		// We want to emit add after the values have all been assigned.
		// Otherwise, we would have unassigned values in the array.
		// Additionally, we always emit the value from _arr since the key may
		// not exist.
	
		this.emit('add', i, this._arr[i].valueOf());
	}
};

ArrayTome.prototype.valueOf = function () {
	return this._arr ? this._arr : [];
};

ArrayTome.prototype.typeOf = function () {
	return 'array';
};

ArrayTome.prototype.join = function (separator) {
	var out = '';
	if (!this._arr.length) {
		return out;
	}

	if (separator === undefined) {
		separator = ',';
	}

	out += this._arr[0];

	for (var i = 1, len = this._arr.length; i < len; i += 1) {
		out += separator;
		var e = this._arr[i];
		if (e.typeOf() !== 'null' && e.typeOf() !== 'undefined') {
			out += this._arr[i].toString();
		}
	}

	return out;
};

ArrayTome.prototype.toString = function () {
	return this.join();
};

ArrayTome.prototype.set = function (key, val) {
	if (parseInt(key, 10).toString() !== key.toString()) {
		Tome.prototype.set.apply(this, arguments);
		return;
	}

	if (key < 0) {
		return;
	}

	if (key >= this._arr.length) {
		var len = this._arr.length;

		this._arr[key] = Tome.conjure(val, this, key);
		this[key] = this._arr[key];
		this.length = this._arr.length;
		this.emit('add', key, this._arr[key].valueOf());

		for (var i = len, newlen = this._arr.length - 1; i < newlen; i += 1) {
			this._arr[i] = Tome.conjure(undefined, this, i);
			this.length = this._arr.length;
			this.emit('add', i, this._arr[i].valueOf());
		}

		var diff = {};
		diff[key] = val;
		this.diff('set', diff);
	} else {
		if (this[key] instanceof Tome) {
			this[key].assign(val);
		}
	}
	return this._arr[key].valueOf();
};

ArrayTome.prototype.del = function (key) {
	if (!this.hasOwnProperty(key)) {
		throw new ReferenceError('ArrayTome.del - Key is not defined: ' + key);
	}

	if (!this[key] instanceof Tome) {
		throw new TypeError('ArrayTome.del - Key is not a Tome: ' + key);
	}

	this._arr[key] = Tome.conjure(undefined, this, key);
	this[key] = this._arr[key];

	this.emit('del', key);
	this.diff('del', key);
};

ArrayTome.prototype.consume = function (diff) {
	var i;

	for (var key in diff) {
		var val = diff[key];
		switch (key) {
		case 'del':
			this.del(val);
			break;
		case 'pop':
			for (i = 0; i < val; i += 1) {
				this.pop();
			}
			break;
		case 'push':
			this.push.apply(this, val);
			break;
		case 'rename':
			this.rename(val);
			break;
		case 'reverse':
			this.reverse();
			break;
		case 'shift':
			for (i = 0; i < val; i += 1) {
				this.shift();
			}
			break;
		case 'splice':
			this.splice.apply(this, val);
			break;
		case 'unshift':
			this.unshift.apply(this, val);
			break;
		default:
			Tome.prototype.consume.apply(this, arguments);
		}
	}
};

ArrayTome.prototype.shift = function () {
	var out = this._arr.shift();
	var key = 0;
	var o = this[key];

	if (o instanceof Tome) {
		delete this[key];

		for (var i = 0, len = this._arr.length; i < len; i += 1) {
			this[i] = this._arr[i];
			this._arr[i].__key__ = i;
		}

		delete this[len];

		this.length = this._arr.length;
		o.destroy();
		this.emit('del', key);
		this.diff('shift', 1);
	}

	return out ? out.valueOf() : out;
};

ArrayTome.prototype.pop = function () {
	var oldlen = this._arr.length;

	var out = this._arr.pop();
	var len = this._arr.length;
	
	if (oldlen > len) {
		this.length = len;
		
		var o = this[len];

		delete this[len];

		if (o instanceof Tome) {
			o.destroy();
		}

		this.emit('del', len);
		this.diff('pop', 1);
	}

	return out ? out.valueOf() : out;
};

ArrayTome.prototype.push = function () {
	var length = this._arr.length;

	if (arguments.length) {
		var args = new Array(arguments.length);
		for (var i = 0, len = arguments.length; i < len; i += 1) {
			var k = length + i;
			this._arr.push(Tome.conjure(arguments[i], this, k));
			this[k] = this._arr[k];
			this.length = this._arr.length;
			this.emit('add', k, this[k].valueOf());
			args[i] = arguments[i];
		}
		this.diff('push', args);
	}
	return this.length;
};

ArrayTome.prototype.reverse = function () {
	this._arr.reverse();

	for (var i = 0, len = this._arr.length; i < len; i += 1) {
		this[i] = this._arr[i];
		this._arr[i].__key__ = i;
	}

	this.diff('reverse', 1);

	return this;
};

ArrayTome.prototype.splice = function (spliceIndex, toRemove) {
	spliceIndex = spliceIndex >= 0 ? Math.min(spliceIndex, this._arr.length) : Math.max(this._arr.length + spliceIndex, 0);
	var toAdd = [];

	var i, len, key, args;

	args = new Array(arguments.length);
	args[0] = spliceIndex;
	args[1] = toRemove;

	for (i = 2, len = arguments.length; i < len; i += 1) {
		toAdd.push(arguments[i]);
		args[i] = arguments[i];
	}

	var out = this._arr.splice(spliceIndex, toRemove);

	for (i = 0, len = out.length; i < len; i += 1) {
		key = spliceIndex + i;
		var o = this[key];
		delete this[key];
		this.length = this._arr.length;
		if (o instanceof Tome) {
			o.destroy();
		}
		this.emit('del', key);
	}

	for (i = 0, len = toAdd.length; i < len; i += 1) {
		key = spliceIndex + i;
		this._arr.splice(key, 0, Tome.conjure(toAdd[i], this, key));
		this[key] = this._arr[key];
		this.length = this._arr.length;
		this.emit('add', key, this[key].valueOf());
	}

	for (i = 0, len = this._arr.length; i < len; i += 1) {
		this[i] = this._arr[i];
	}

	if (out.length > toAdd.length) {
		for (i = 0, len = out.length; i < len; i += 1) {
			key = this._arr.length + i;
			delete this[key];
		}
	}

	if (toRemove || toAdd.length) {
		this.diff('splice', args);
	}

	return out;
};

ArrayTome.prototype.rename = function (val) {
	if (Tome.typeOf(val) === 'array') {
		var diff = [];

		for (var i = 0, len = val.length; i < len; i += 1) {
			var r = val[i];
			this._arr[r.o].__key__ = r.n;
			diff.push({ 'o': r.o, 'n': r.n });
		}

		this._arr.sort(function (a, b) { return a.__key__ - b.__key__; });

		for (i = 0, len = this._arr.length; i < len; i += 1) {
			this[i] = this._arr[i];
		}

		this.diff('rename', diff);
	}
};

ArrayTome.prototype.sort = function () {
	this._arr.sort.apply(this._arr, arguments);

	var diff = [];

	for (var i = 0, len = this._arr.length; i < len; i += 1) {
		if (this._arr[i].__key__ !== i) {
			var oldkey = this._arr[i].__key__;
			this._arr[i].__key__ = i;
			this[i] = this._arr[i];
			diff.push({ 'o': oldkey, 'n': i });
		}
	}

	this.diff('rename', diff);

	return this;
};

ArrayTome.prototype.unshift = function () {
	if (arguments.length) {
		var args, i, len;
		
		args = new Array(arguments.length);
		
		for (i = arguments.length - 1; i >= 0; i -= 1) {
			this._arr.unshift(Tome.conjure(arguments[i], this, i));
			args[i] = arguments[i];
		}

		for (i = 0, len = this._arr.length; i < len; i += 1) {
			this[i] = this._arr[i];
			this._arr[i].__key__ = i;
		}

		for (i = 0, len = arguments.length; i < len; i += 1) {
			this.length = this._arr.length;
			this.emit('add', i, this[i].valueOf());
		}

		this.diff('unshift', args);
	}

	return this._arr.length;
};

ArrayTome.prototype.indexOf = function (searchElement) {
	var t = this._arr;
	var len = t.length;
	if (len === 0) {
		return -1;
	}
	var n = 0;
	if (arguments.length > 1) {
		n = Number(arguments[1]);
		if (n !== n) { // shortcut for verifying if it's NaN
			n = 0;
		} else if (n !== 0 && n !== Infinity && n !== -Infinity) {
			n = (n > 0 || -1) * Math.floor(Math.abs(n));
		}
	}
	if (n >= len) {
		return -1;
	}
	var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
	for (; k < len; k += 1) {
		if (k in t && t[k].valueOf() === searchElement) {
			return k;
		}
	}
	return -1;
};

ArrayTome.prototype.lastIndexOf = function (searchElement) {
	var t = this._arr;
	var len = t.length;
	if (len === 0) {
		return -1;
	}
	var n = len;
	if (arguments.length > 1) {
		n = Number(arguments[1]);
		if (n !== n) {
			n = 0;
		} else if (n !== 0 && n !== Infinity && n !== -Infinity) {
			n = (n > 0 || -1) * Math.floor(Math.abs(n));
		}
	}
	var k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n);
	for (; k >= 0; k -= 1) {
		if (k in t && t[k].valueOf() === searchElement) {
			return k;
		}
	}
	return -1;
};

ArrayTome.prototype.concat = function () {
	var out = Tome.conjure([]);
	var len = this._arr.length;

	out._arr = new Array(len);

	for (var i = 0; i < len; i += 1) {
		out._arr[i] = this._arr[i];
		out[i] = out._arr[i];
	}

	var arglen = arguments.length;
	var j, ken;

	for (i = 0; i < arglen; i += 1) {
		var newVal = arguments[i];
		var newValType = Tome.typeOf(newVal);
		if (newVal instanceof Tome) {
			if (newValType === 'array') {
				for (j = 0, ken = newVal.length; j < ken; j += 1) {
					out._arr.push(newVal[j]);
					out[len] = out._arr[len];
					len += 1;
				}
			} else {
				out._arr.push(newVal);
				out[len] = out._arr[len];
				len += 1;
			}
		} else {
			if (newValType === 'array') {
				for (j = 0, ken = newVal.length; j < ken; j += 1) {
					out._arr.push(Tome.conjure(newVal[j]));
					out[len] = out._arr[len];
					len += 1;
				}
			} else {
				out._arr.push(Tome.conjure(newVal));
				out[len] = out._arr[len];
				len += 1;
			}
		}
	}

	out.length = len;

	return out;
};

ArrayTome.prototype.slice = function () {
	return this._arr.slice.apply(this._arr, arguments);
};

ArrayTome.prototype.map = function () {
	return this._arr.map.apply(this._arr, arguments);
};

ArrayTome.prototype.reduce = function () {
	return this._arr.reduce.apply(this._arr, arguments);
};

ArrayTome.prototype.reduceRight = function () {
	return this._arr.reduceRight.apply(this._arr, arguments);
};

ArrayTome.prototype.filter = function () {
	return this._arr.filter.apply(this._arr, arguments);
};

ArrayTome.prototype.some = function () {
	return this._arr.some.apply(this._arr, arguments);
};

ArrayTome.prototype.every = function () {
	return this._arr.every.apply(this._arr, arguments);
};

ArrayTome.prototype.forEach = function () {
	return this._arr.forEach.apply(this._arr, arguments);
};


//   ______   __                                      __
//  /      \ |  \                                    |  \
// |  $$$$$$\| $$____       __   ______    _______  _| $$_
// | $$  | $$| $$    \     |  \ /      \  /       \|   $$ \
// | $$  | $$| $$$$$$$\     \$$|  $$$$$$\|  $$$$$$$ \$$$$$$
// | $$  | $$| $$  | $$    |  \| $$    $$| $$        | $$ __
// | $$__/ $$| $$__/ $$    | $$| $$$$$$$$| $$_____   | $$|  \
//  \$$    $$| $$    $$    | $$ \$$     \ \$$     \   \$$  $$
//   \$$$$$$  \$$$$$$$__   | $$  \$$$$$$$  \$$$$$$$    \$$$$
//                   |  \__/ $$
//                    \$$    $$
//                     \$$$$$$


inherits(ObjectTome, Tome);

exports.ObjectTome = ObjectTome;

ObjectTome.isObjectTome = function (o) {
	return o instanceof ObjectTome;
};

ObjectTome.prototype.init = function (val) {

	// An ObjectTome is a Tome that holds other Tomes. It has no
	// non-enumerable properties. Every property of an ObjectTome is an
	// instance of another Tome.

	// There is one special case we need to handle with the ObjectTome type
	// and that is when the value of a property is undefined. To match
	// javascript's behavior we assign undefined directly to the property
	// instead of creating an UndefinedTome since when you JSON.stringify an
	// object with a property that has undefined as its value, it will
	// leave that property out. This is different behavior from arrays
	// which will stringify undefined elements to null.

	var added = Object.keys(val);
	var len = added.length;
	var k;

	for (var i = 0; i < len; i += 1) {
		k = added[i];
		var kv = val[k];
		if (kv === undefined) {
			this[k] = undefined;
		} else {
			this[k] = Tome.conjure(kv, this, k);
		}
	}

	// Just like with arrays, we only want to emit add after we are done
	// assigning values. We used Object.keys to get an array of all the
	// properties we assigned so we can use it again to do the emission of
	// adds. We also need to pay special attention when emitting add on
	// undefined keys.

	for (i = 0; i < len; i += 1) {
		k = added[i];
		this.emit('add', k, this[k] ? this[k].valueOf() : undefined);
	}
};

ObjectTome.prototype.typeOf = function () {
	return 'object';
};

ObjectTome.prototype.rename = function (o, n) {
	var oType = Tome.typeOf(o);
	var oldKey, newKey;

	switch (oType) {
	case 'object':
		oldKey = o.o;
		newKey = o.n;
		break;
	case 'array':
		this.startBatch();
		for (var i = 0, len = o.length; i < len; i += 1) {
			oldKey = o[i].o;
			newKey = o[i].n;
			this.rename(oldKey, newKey);
		}
		this.endBatch();
		break;
	case 'string':
		oldKey = o;
		newKey = n;
		break;
	default:
		throw new TypeError('ObjectTome.rename - Invalid arguments');
	}

	if (!this.hasOwnProperty(oldKey)) {
		throw new ReferenceError('ObjectTome.rename - Key is not defined: ' + oldKey);
	}

	if (this.hasOwnProperty(newKey)) {
		this.del(newKey);
	}

	this[newKey] = this[oldKey];
	this[newKey].__key__ = newKey;
	delete this[oldKey];

	this.emit('rename', oldKey, newKey);

	this.diff('rename', { o: oldKey, n: newKey });
};

ObjectTome.prototype.consume = function (diff) {
	for (var key in diff) {
		var val = diff[key];
		switch (key) {
		case 'del':
			this.del(val);
			break;
		case 'rename':
			this.rename(val);
			break;
		default:
			Tome.prototype.consume.apply(this, arguments);
		}
	}
};


//   ______                      __
//  /      \                    |  \
// |  $$$$$$\  _______  ______  | $$  ______    ______
// | $$___\$$ /       \|      \ | $$ |      \  /      \
//  \$$    \ |  $$$$$$$ \$$$$$$\| $$  \$$$$$$\|  $$$$$$\
//  _\$$$$$$\| $$      /      $$| $$ /      $$| $$   \$$
// |  \__| $$| $$_____|  $$$$$$$| $$|  $$$$$$$| $$
//  \$$    $$ \$$     \\$$    $$| $$ \$$    $$| $$
//   \$$$$$$   \$$$$$$$ \$$$$$$$ \$$  \$$$$$$$ \$$


inherits(ScalarTome, Tome);

exports.ScalarTome = ScalarTome;

ScalarTome.isScalarTome = function (o) {
	return o instanceof ScalarTome;
};

ScalarTome.prototype.init = function (val) {
	Object.defineProperty(this, '_val', { configurable: true, writable: true });
	
	this._val = val.valueOf();
};

ScalarTome.prototype.valueOf = function () {
	return this._val;
};

ScalarTome.prototype.typeOf = function () {
	return typeof this._val;
};

ScalarTome.prototype.toString = function () {
	return this._val.toString();
};


//  _______                       __
// |       \                     |  \
// | $$$$$$$\  ______    ______  | $$  ______    ______   _______
// | $$__/ $$ /      \  /      \ | $$ /      \  |      \ |       \
// | $$    $$|  $$$$$$\|  $$$$$$\| $$|  $$$$$$\  \$$$$$$\| $$$$$$$\
// | $$$$$$$\| $$  | $$| $$  | $$| $$| $$    $$ /      $$| $$  | $$
// | $$__/ $$| $$__/ $$| $$__/ $$| $$| $$$$$$$$|  $$$$$$$| $$  | $$
// | $$    $$ \$$    $$ \$$    $$| $$ \$$     \ \$$    $$| $$  | $$
//  \$$$$$$$   \$$$$$$   \$$$$$$  \$$  \$$$$$$$  \$$$$$$$ \$$   \$$


inherits(BooleanTome, ScalarTome);

exports.BooleanTome = BooleanTome;

BooleanTome.isBooleanTome = function (o) {
	return o instanceof BooleanTome;
};


//  __    __                          __
// |  \  |  \                        |  \
// | $$\ | $$ __    __  ______ ____  | $$____    ______    ______
// | $$$\| $$|  \  |  \|      \    \ | $$    \  /      \  /      \
// | $$$$\ $$| $$  | $$| $$$$$$\$$$$\| $$$$$$$\|  $$$$$$\|  $$$$$$\
// | $$\$$ $$| $$  | $$| $$ | $$ | $$| $$  | $$| $$    $$| $$   \$$
// | $$ \$$$$| $$__/ $$| $$ | $$ | $$| $$__/ $$| $$$$$$$$| $$
// | $$  \$$$ \$$    $$| $$ | $$ | $$| $$    $$ \$$     \| $$
//  \$$   \$$  \$$$$$$  \$$  \$$  \$$ \$$$$$$$   \$$$$$$$ \$$


exports.NumberTome = NumberTome;

NumberTome.isNumberTome = function (o) {
	return o instanceof NumberTome;
};

inherits(NumberTome, ScalarTome);

NumberTome.prototype.inc = function (val) {
	if (typeof val !== 'number') {
		throw new TypeError('You can only increment by a number');
	}

	this._val = this._val + val;
	this.diff('inc', val);
};

NumberTome.prototype.consume = function (diff) {
	var key, val;
	for (key in diff) {
		val = diff[key];
		if (key === 'inc') {
			this.inc(val);
			continue;
		}
		Tome.prototype.consume.apply(this, arguments);
	}
};


//   ______     __                __
//  /      \   |  \              |  \
// |  $$$$$$\ _| $$_     ______   \$$ _______    ______
// | $$___\$$|   $$ \   /      \ |  \|       \  /      \
//  \$$    \  \$$$$$$  |  $$$$$$\| $$| $$$$$$$\|  $$$$$$\
//  _\$$$$$$\  | $$ __ | $$   \$$| $$| $$  | $$| $$  | $$
// |  \__| $$  | $$|  \| $$      | $$| $$  | $$| $$__| $$
//  \$$    $$   \$$  $$| $$      | $$| $$  | $$ \$$    $$
//   \$$$$$$     \$$$$  \$$       \$$ \$$   \$$ _\$$$$$$$
//                                             |  \__| $$
//                                              \$$    $$
//                                               \$$$$$$


exports.StringTome = StringTome;

StringTome.isStringTome = function (o) {
	return o instanceof StringTome;
};

inherits(StringTome, ScalarTome);


//  __    __            __  __
// |  \  |  \          |  \|  \
// | $$\ | $$ __    __ | $$| $$
// | $$$\| $$|  \  |  \| $$| $$
// | $$$$\ $$| $$  | $$| $$| $$
// | $$\$$ $$| $$  | $$| $$| $$
// | $$ \$$$$| $$__/ $$| $$| $$
// | $$  \$$$ \$$    $$| $$| $$
//  \$$   \$$  \$$$$$$  \$$ \$$


exports.NullTome = NullTome;

NullTome.isNullTome = function (o) {
	return o instanceof NullTome;
};

inherits(NullTome, Tome);

NullTome.prototype.init = function () {

};

NullTome.prototype.valueOf = function () {
	return null;
};

NullTome.prototype.typeOf = function () {

	// Here we make an abrupt departure from pedantically duplicating the
	// behavior of JavaScript. Instead of null being an object, we call it
	// null.

	return 'null';
};


//  __    __                  __             ______   __                            __
// |  \  |  \                |  \           /      \ |  \                          |  \
// | $$  | $$ _______    ____| $$  ______  |  $$$$$$\ \$$ _______    ______    ____| $$
// | $$  | $$|       \  /      $$ /      \ | $$_  \$$|  \|       \  /      \  /      $$
// | $$  | $$| $$$$$$$\|  $$$$$$$|  $$$$$$\| $$ \    | $$| $$$$$$$\|  $$$$$$\|  $$$$$$$
// | $$  | $$| $$  | $$| $$  | $$| $$    $$| $$$$    | $$| $$  | $$| $$    $$| $$  | $$
// | $$__/ $$| $$  | $$| $$__| $$| $$$$$$$$| $$      | $$| $$  | $$| $$$$$$$$| $$__| $$
//  \$$    $$| $$  | $$ \$$    $$ \$$     \| $$      | $$| $$  | $$ \$$     \ \$$    $$
//   \$$$$$$  \$$   \$$  \$$$$$$$  \$$$$$$$ \$$       \$$ \$$   \$$  \$$$$$$$  \$$$$$$$


exports.UndefinedTome = UndefinedTome;

UndefinedTome.isUndefinedTome = function (o) {
	return o instanceof UndefinedTome;
};

inherits(UndefinedTome, Tome);

UndefinedTome.prototype.init = function () {

};

UndefinedTome.prototype.valueOf = function () {
	return undefined;
};

UndefinedTome.prototype.typeOf = function () {
	return 'undefined';
};

UndefinedTome.prototype.toJSON = function () {

	// When you JSON.stringify an array with elements that have undefined
	// values, they stringify as 'null' so we do the same thing here to match
	// the behavior of JavaScript. That is the sole reason for UndefinedTome's
	// existence.

	return null;
};