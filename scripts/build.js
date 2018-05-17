require('rimraf')('./bin', function (err) {
   if (err) {
      throw err
      return
   }
   
   require('./lessc.js')()
   require('./pugc.js')()
   require('./jscpy.js')()
   require('./imgcpy.js')()
   
   require('./ioutil.js').copy('./src/favicon.ico', './bin/favicon.ico')   
})
