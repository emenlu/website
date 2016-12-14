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

app.set("port", "8181");
app.set("views", path.join(__dirname, "src", "views"));
app.set("view engine", "jade");
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
app.use(favicon(path.join(__dirname, "src/favicon.ico")));

// Run `env=production node app.js` to use dev frontend with prod backend
// Run `env=development node app.js` to use dev frontend and dev backend
var env = process.env.env || app.get("env")
if ("development" === env) {
    console.log("development mode activated")
    app.use(errorHandler());

    app.use((req, res, nxt) => {
        res.locals.env = "dev"
        nxt()
    })
}

// for simplicity, links may have .html added to allow browsing from
// local file system. since we want jade templates to be loaded, force
// browser to load the them instead. by redirection...
app.use(function(req, res, next) {
    if (req.path.indexOf('.html') >= 0) {
        var query = Object.keys(req.query).map(k => k + "=" + req.query[k]).join('&')
        res.redirect(req.path.replace('.html', '') + "?" + query)
    } else
        next()
})

app.get("/", function(req, res) {
    res.render("index");
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.get("/profile", function(req, res) {
    res.render("profile");
});

app.get("/invitations", function(req, res) {
    res.render("invitations");
});

app.get("/users", function(req, res) {
    res.render("users");
});

app.get("/entries", function(req, res) {
    res.render("entries");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/search", function(req, res) {
    res.render("search");
});

app.get("/submit", function(req, res) {
    res.render("submit");
});

app.get("/explore", function(req, res) {
    res.render("explore");
});

app.get("/collection", function(req, res) {
    res.render("collection");
});
app.get("/collection/entries", function(req, res) {
    res.render("collection/entries");
});
app.get("/collection/users", function(req, res) {
    res.render("collection/users");
});

app.get("/resetpassword", function(req, res) {
    res.render("resetpassword");
});

app.get("*", function(req, res) {
    res.status(404).render("404");
});

var server = http.createServer(app);
server.listen(app.get("port"), function(){
    console.log("Prototypal express server running on port " + app.get("port"));
});

var log = console.log;
