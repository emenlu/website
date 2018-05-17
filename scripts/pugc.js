var path = require('path')
var pug = require('pug')
var ioutil = require('./ioutil.js')
var config = require('../config')

// prod | live | dev
var prodMode = (process.argv[2] || process.env["NODE_ENV"] || "unspecified")
if (prodMode[0] === '-') prodMode = prodMode.substr(2)
if (prodMode !== "prod" &&
	prodMode !== 'live' &&
	prodMode !== 'dev') {
		console.error("'" + prodMode + "' not valid: use --live, --dev or --prod!")
		process.exit(1)
}

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
	
	var html = pug.renderFile(src, {
		filename: src,
		env: prodMode,
		settings: config
	})
	ioutil.log('pugc', src, '-->', dst)
	ioutil.writeFile(dst, html)
}

module.exports = function (file) {
	ioutil.process('./shared/components/views/', './bin/', render)(file);
	ioutil.process('./src/views/', './bin/', render)(file);
}
