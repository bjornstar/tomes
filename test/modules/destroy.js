var Tome = require('../..');

exports.testSelfDestroy = function (test) {
  test.expect(5);

  var a = { b: { c: 1 }, d: { e: 1} };
  var b = Tome.conjure(a);

  function fail() {
    test.ok();
  }

  function ok() {
    test.ok(true);
  }

  b.on('readable', fail);

  b.on('destroy', ok);
  b.b.on('destroy', ok);
  b.b.c.on('destroy', ok);
  b.d.on('destroy', ok);
  b.d.e.on('destroy', ok);

  b.destroy();
  // Calling a 2nd time shouldn't have any effect.
  b.destroy();

  test.done();
};

exports.testTomeDestroy = function (test) {
  test.expect(5);

  var a = { b: { c: 1 }, d: { e: 1} };
  var b = Tome.conjure(a);

  function fail() {
    test.ok();
  }

  function ok() {
    test.ok(true);
  }

  b.on('readable', fail);

  b.on('destroy', ok);
  b.b.on('destroy', ok);
  b.b.c.on('destroy', ok);
  b.d.on('destroy', ok);
  b.d.e.on('destroy', ok);

  Tome.destroy(b);
  // Calling a 2nd time shouldn't have any effect.
  Tome.destroy(b);

  test.done();
};
