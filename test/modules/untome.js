var trueName = require('rumplestiltskin').trueName;
var Tome = require('../..');

exports.unTomeNumber = function (test) {
	test.expect(1);

	var a = 1;
	var b = Tome.conjure(a);

	test.strictEqual(trueName(a), trueName(Tome.unTome(b)));

	test.done();
};

exports.unTomeString = function (test) {
	test.expect(1);

	var a = 'the unTome.';
	var b = Tome.conjure(a);

	test.strictEqual(trueName(a), trueName(Tome.unTome(b)));

	test.done();
};

exports.unTomeNull = function (test) {
	test.expect(1);

	var a = null;
	var b = Tome.conjure(a);

	test.strictEqual(trueName(a), trueName(Tome.unTome(b)));

	test.done();
};

exports.unTomeBoolean = function (test) {
	test.expect(1);

	var a = false;
	var b = Tome.conjure(a);

	test.strictEqual(trueName(a), trueName(Tome.unTome(b)));

	test.done();
};

exports.unTomeArray = function (test) {
	test.expect(1);

	var a = [ 0, 1, 2, 'hi', null, undefined, { a: 'nope' } ];
	var b = Tome.conjure(a);

	test.strictEqual(trueName(a), trueName(Tome.unTome(b)));

	test.done();
};

exports.unTomeComplex = function (test) {
	test.expect(1);

	var a = { a: { b: true, c: undefined, d: null, e: [ 0, 1, 'hi', 'cat' ], f: { g: false } }, h: undefined, i: 1, j: false };
	var b = Tome.conjure(a);

	test.strictEqual(trueName(a), trueName(Tome.unTome(b)));

	test.done();
};

exports.unTomeRepeated = function (test) {
	test.expect(1);

	var a = [ undefined, undefined, undefined, undefined ];

	test.doesNotThrow(function () {
		Tome.unTome(a);
	});

	test.done();
};

exports.unTomeCircularReference = function (test) {
	test.expect(1);

	function CircularReference() {
		this.circularReference = this;
	}

	var circRefs = new CircularReference();

	test.throws(function () {
		Tome.unTome(circRefs);
	}, TypeError, 'expected a TypeError');

	test.done();
};

exports.unTomeSelf = function (test) {
	test.expect(1);

	var a = { a: '1', b: false, c: null, d: 1234.5667 };
	var b = Tome.conjure(a);

	test.strictEqual(trueName(a), trueName(b.unTome()));

	test.done();
};

exports.unTomeSelfCache = function (test) {
	test.expect(3);

	var a = { a: '1', b: false, c: null, d: 1234.5667 };
	var b = Tome.conjure(a);

	var c = b.unTome();
	var d = b.unTome();
	test.strictEqual(c, d);
	test.notEqual(a, c);

	b.set('e', []);
	var e = b.unTome();
	test.notEqual(d, e);

	test.done();
};
