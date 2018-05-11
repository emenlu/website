const ioutil = require('./ioutil.js')
const babel = require('babel-core')

/* libraries that do weird injection stuff and gets broken by babel */
const exclude = ['sigma.min.js', 'fuse.min.js']

/* babel needs to be told what transforms to use; es2015~ES6 */
const babelOpt = {
	presets: ['es2015']
}

/* copy/transpile/compile javascript files with babeljs
 *
 *	file:
 *		- undefined: process js dir
 *		- relative path: only copy that path/file
 */
function compile(file, src, dst) {
	if (file.ext !== '.js')
		return

	ioutil.log('jscpy', src, '-->', dst)
	if (exclude.some(lib => file.name === lib)) {
		ioutil.copy(src, dst)
		return
	}

	babel.transformFile(src, babelOpt, (err, res) => {
		if (err) {
			console.error(err)
			return
		}

		ioutil.writeFile(dst, res.code)
	})
}

module.exports = function (file) {
	ioutil.process('./shared/components/js/', './bin/js/', compile)(file);
	ioutil.process('./src/js/', './bin/js/', compile)(file);
}
