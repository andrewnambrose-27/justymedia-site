const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.JUSTY_SITE_PORT || 4173);
const redirects = new Map(
  fs.readFileSync(path.join(root, "_redirects"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => { const [from, to, status] = line.split(/\s+/); return [from, { to, status: Number(status) }]; })
);
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"
};

function safeFile(pathname) {
  let clean = decodeURIComponent(pathname);
  const imageMatch = clean.match(/^\/cdn-cgi\/image\/[^/]+(\/.*)$/);
  if (imageMatch) clean = imageMatch[1];
  clean = clean.replace(/^\/+/, "");
  let file = path.resolve(root, clean || "index.html");
  if (!file.startsWith(root)) return null;
  if (!path.extname(file)) file = path.join(file, "index.html");
  return file;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const redirect = redirects.get(url.pathname);
  if (redirect) {
    response.writeHead(redirect.status, { Location: `${redirect.to}${url.search}` });
    response.end();
    return;
  }

  const file = safeFile(url.pathname);
  if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
    response.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(file).pipe(response);
    return;
  }

  response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  fs.createReadStream(path.join(root, "404.html")).pipe(response);
});

server.listen(port, "127.0.0.1", () => console.log(`Justy Media test server: http://127.0.0.1:${port}/`));
