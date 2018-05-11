var path = require('path')
var pug = require('pug')
var ioutil = require('./ioutil.js')
var config = require('../config')

var prodMode = process.env["BUILD_MODE"] === "prod"

/* don't render the layout template */
var exclude = ['base.pug']

/* render pug files in serpent/src/views --> serpent/bin
 *
 *	file:
 *		- undefined: process pug dir
 *		- relative path: only render that path/file
 */
function render(file, src, dst) {
	if (file.ext !== '.pug')
		return

	if (exclude.some(n => n === file.name))
		return

	/* xyz.pug --> xyz.html */
	dst = path.join(path.dirname(dst), path.basename(file.name, file.ext))
		+ '.html'

	ioutil.log('pugc', src, '-->', dst)
	var env = prodMode ? "prod" : "dev"

	ioutil.writeFile(dst, pug.renderFile(src, {
		filename: src,
		env: env,
		settings: config
	}))
}

module.exports = function (file) {
	ioutil.process('./shared/components/views/', './bin/', render)(file);
	ioutil.process('./src/views/', './bin/', render)(file);
}
