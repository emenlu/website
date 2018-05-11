const ioutil = require('./ioutil.js')

/* allowed image extensions (case-sensitive) */
var allowed = ['.png', '.jpg', '.jpeg', '.svg']

/* copy images from serpent/src/img --> serpent/bin/img
 *
 *	file:
 *		- undefined: process img dir
 *		- relative path: only copy that path/file
 */
 var copy = function (file, src, dst) {
 	if (allowed.indexOf(file.ext) === -1)
 		return

	ioutil.log('imgcpy', src, '-->', dst)
	ioutil.copy(src, dst)
}

module.exports = function (file) {
	ioutil.process('./shared/components/img/', './bin/img/', copy)(file);
	ioutil.process('./src/img/', './bin/img/', copy)(file);
}
