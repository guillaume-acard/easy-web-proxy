const SimpleNodeLogger = require("simple-node-logger");
const express = require("express");
const fs = require('fs');
const https = require('https');
const compression = require("compression");
const httpProxy = require("http-proxy-middleware");
const path = require("path");

const logger = SimpleNodeLogger.createSimpleLogger({
    logFilePath: 'ul-app-proxy.log',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
});

const configFilePath = process.argv[3] || "config.json";
if(!fs.existsSync(configFilePath)){
    logger.error(`Config file not found: ${configFilePath}`);
    return -1;
}
logger.info(`Config file: ${configFilePath}`);
let configContent = JSON.parse(fs.readFileSync(configFilePath));
if(!Array.isArray(configContent)){
    configContent = [configContent];
}

logger.info("Starting ul-app-proxy");

for(const { port, static, proxy, redirect, debug, ssl } of configContent){
    const app = express();
    app.use(compression());
    
    app.set("host", process.env.HOST || process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost");
    app.set("port", process.env.PORT || port || 4001);
    logger.info(`=== Starting server ${ssl? "with ssl ":""}on port ${app.get("port")} ===`);
    
    if (debug) {
        logger.setLevel('debug');
        logger.info("DEBUG mode activated");
    }
    
    if (proxy) {
        logger.info(`Adding ${proxy.length} proxy routes:`);
        proxy.forEach(proxyItem => {
            logger.info(`- Adding proxy route: \t${proxyItem.path} -> ${proxyItem.target}`);
            app.use(proxyItem.path, httpProxy({
                target: proxyItem.target,
                secure: false,
                ws: true,
                pathRewrite: (path, req) => {
                    const newPath = path.substring(proxyItem.path.length);
                    if (debug) logger.debug(`Path rewrite: ${path} -> ${proxyItem.target}${newPath}`);
                    return newPath;
                }
            }));
        });
    }
    
    if (static) {
        logger.info(`Adding ${static.length} static routes:`);
        static.forEach(staticItem => {
            logger.info(`- Adding static route: \t${staticItem.path} -> ${staticItem.target}`);
            app.use(staticItem.path, express.static(staticItem.target));
            if (!staticItem.strict) {
                const defaultPath = path.join(staticItem.target, "index.html");
                logger.info(`- Adding default route: \t${staticItem.path}/* -> ${defaultPath}`);
                app.get(`${staticItem.path}/*`, (req, res) => {
                    if (debug) logger.debug(`Serving default for ${staticItem.path}: ${req.path} -> ${defaultPath}`);
                    res.sendFile(defaultPath);
                });
            }
        });
    }
    if (static) {
        const defaultStatic = static.find(staticItem => staticItem.default);
        if (defaultStatic) {
            const defaultPath = path.join(defaultStatic.target, "index.html");
            logger.info(`Adding default static route: ${defaultStatic.path} => ${defaultStatic.target}`);
            app.get("/*", (req, res) => {
                if (debug) logger.debug(`Serving default path: ${defaultPath}`);
                res.sendFile(defaultPath);
            });
        }
    }
    
    if (redirect) {
        redirect.forEach(({ port, target }) => {
            if (port) {
                const redirectApp = express();
                const targetPort = ![80,443].includes(app.get("port"))? `:${app.get("port")}` : "";
                redirectApp.get("/*", (req, res) => {
                    const targetUrl = `${req.protocol}://${req.host}${targetPort}${req.url}`;
                    logger.debug(`Redirecting ${req.url} to ${targetUrl}`);
                    res.status(301).redirect(targetUrl);
                });
                redirectApp.listen(port, () => {
                    logger.info(`Port redirection started: from=${port} to=${app.get("port")}`);
                })
            } else {
                logger.console.warn(`No incoming port provided for redirection. Prefer using a proxy in this case.`);
            }
        });
    }
    
    // Final phase - create and start web server
    let server = null;
    if (ssl) {
        server = https.createServer({
            key: fs.readFileSync(ssl.key),
            cert: fs.readFileSync(ssl.cert)
        }, app);
    } else {
        server = app;
    }
    
    server.listen(app.get("port"), () => {
        logger.info(`Find the server at: http${ssl?"s": ""}://${app.get("host")}:${app.get("port")}/`);
    });
}