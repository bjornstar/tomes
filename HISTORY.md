# @bjornstar/tomes Release Notes

## v1.1.1 / 2020-08-15
* [HISTORY.md](./HISTORY.md): Add dates next to version numbers
* [HISTORY.md](./HISTORY.md): Prefix versions with v
* [HISTORY.md](./HISTORY.md): Add v0.0.16
* [HISTORY.md](./HISTORY.md): Try a new style for referencing files

## v1.1.0 / 2020-08-15
* [test](./test/modules/array.js): Fix array sort test failure
* Remove Makefile and associated scripts
* [.travis.yml](./.travis.yml): Test on node 14, 12, and 10
* [HISTORY.md](./HISTORY.md): Fix markdown
* [README.md](./README.md): Fix markdown

## v1.0.0 / 2017-03-14
* Repeated calls to unTome return the same object

## v1.0.0-beta.5 / 2017-02-07
* Tomes now have a destroy method
* Add .jshintrc and run on tests

## v1.0.0-beta.4 / 2016-11-09
* [README.md](./README.md): Fix first link

## v1.0.0-beta.3 / 2016-11-09
* [README.md](./README.md): Point to this fork

## v1.0.0-beta.2 / 2016-11-09
* Tomes now have an unTome method
* Fix a few lint errors in tests

## v1.0.0-beta.1 / 2016-06-03
* Remove component.json
* Always use node events library
* Now available as @bjornstar/tomes
* Export Tome directly
* Put types on Tome itself

## v0.1.0 / 2014-11-19
* Removed the hide method, it was useless and only increased code complexity.
* Added nodei.co badge.
* Added node v0.11 back to travis, maybe it will work now.
* unset executable bit from files.

## v0.0.22 / 2014-11-04
* inc now takes NumberTomes
* [HISTORY.md](./HISTORY.md): Added this file

## v0.0.21 / 2014-05-21
* IE9 support and travis fix for npm horribleness

## v0.0.20 / 2014-01-28
* toLocaleString does not work in browsers so we make a special one for them.

## v0.0.19
* Tomes now behaves similar to JSON in that it throws a TypeError when it detects circular
  references in the data you passed to it. Tomes now does this on conjure and on unTome.

## v0.0.18 / 2013-11-20
* ArrayTome.indexOf and lastIndexOf now do a valueOf on the value to be searched for.

## v0.0.17 / 2013-11-18
* To avoid issues with multiple versions of Tomes not being able to recognize Tomes as Tomes,
  instanceof has been eradicated from Tomes. Instead we now check the to see if the constructor's
  name has Tomes in it. This is not perfect as Tomes will still fail to recognize Tomes from other
  iframes and windows. It's a step in the right direction regardless.
* Tomes now has a readAll method to pull out the entire array of diffs from the root Tome. It seems
  like the vast majority of use cases always pull out all diffs, so this should improve performance
  there.

## v0.0.16 / 2013-10-25
* First public release
