var express = require("express");
var http = require("http");
var path = require("path");
var app = express();
var fs = require("fs");

var bodyParser = require("body-parser");
var methodOverride = require('method-override');
var favicon = require('serve-favicon');
var errorHandler = require('errorhandler');
var less = require("less-middleware");
var config = require('./config')

app.set("port", config.port);
app.set("views", [
   path.join(__dirname, "src", "views"),                 // serve src/views first
   path.join(__dirname, "shared", "components", "views") 
]);
app.set("view engine", "pug");
app.set('view cache', false)
app.use(less(path.join(__dirname, "src"), {
    // don't output css in src/less/
    dest: path.join(__dirname, "bin"),
	preprocess: {
        // fix source path reconstruction: css/a.css --> less/a.less
		path: function (pathname, req) { return pathname.replace('css', 'less') }
	}
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, "bin"))); // host css
app.use(express.static(path.join(__dirname, "src"))); // host everything else
app.use(express.static(path.join(__dirname, "shared", "components"))); // host everything else
app.use(favicon(path.join(__dirname, "src/favicon.ico")));
app.use(errorHandler());

// Run `env=production node app.js` to use dev frontend with prod backend
// Run `env=development node app.js` to use dev frontend and dev backend
var env = process.env.env || app.get("env") || "development"
if ("development" === env) {
    app.use((req, res, nxt) => {
        res.locals.env = "dev"
        nxt()
    })
}

// for simplicity, links may have .html added to allow browsing from
// local file system. since we want pug templates to be loaded, force
// browser to load the them instead. by redirection...
app.use(function(req, res, next) {
    if (req.path.indexOf('.html') >= 0) {
        var query = Object.keys(req.query).map(k => k + "=" + req.query[k]).join('&')
        res.redirect(req.path.replace('.html', '') + "?" + query)
    } else
        next()
})

function renderView(page) {
    return function(req, res) {
        res.render(page, { 
            settings: config
        })
    }
}

app.get("/", renderView('index'));
app.get("/about", renderView("about"));
app.get("/profile", renderView("profile"))
app.get("/invitations", renderView("invitations"));
app.get("/users", renderView("users"))
app.get("/collections", renderView("collections"))
app.get("/entries", renderView("entries"))
app.get("/login", renderView("login"))
app.get("/project", renderView("project"))
app.get("/projects", renderView("projects"))
app.get("/search", renderView("search"))
app.get("/submit", renderView("submit"))
app.get("/explore", renderView("explore"))
app.get("/collection", renderView("collection"))
app.get("/collection/entries", renderView("collection/entries"))
app.get("/collection/users", renderView("collection/users"))
app.get("/collection/taxonomy", renderView("collection/taxonomy"))
app.get("/presentation", renderView("presentation/index"))
app.get("/presentation/explore", renderView("presentation/explore"))
app.get("/presentation/search", renderView("presentation/search"))
app.get("/resetpassword", renderView("resetpassword"))

app.get("*", function(req, res) {
    res.status(404).render("404");
});

var server = http.createServer(app);
server.listen(app.get("port"), function(){
    console.log("Serving on port " + app.get("port"));
    console.log("Views, Styles and Javascript files will be updated on each page reload")
    console.log("Remember to modify `app.js` if you add new views")
    console.log("Remember to modify `all.less` if you add new less files")

    if (env === "production") {
        console.log("===[ LIVE MODE ]===")
        console.log("You are connected to the live backend server. Be careful.")
    } else {
        console.log("===[ DEV MODE ]===")
        console.log("Make sure you have the backend server available on port 8080")
    }
});

