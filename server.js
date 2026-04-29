const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png'
};

function send(response, statusCode, body, contentType = 'text/plain; charset=utf-8') {
    response.writeHead(statusCode, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store'
    });
    response.end(body);
}

function fetchCorpusUrl(path) {
    return new Promise((resolve, reject) => {
        const request = https.get({
            hostname: 'corpus.quran.com',
            path,
            headers: {
                'User-Agent': 'Quran reader live word translation'
            }
        }, (corpusResponse) => {
            if (corpusResponse.statusCode < 200 || corpusResponse.statusCode >= 300) {
                corpusResponse.resume();
                reject(new Error(`Corpus returned ${corpusResponse.statusCode}`));
                return;
            }

            corpusResponse.setEncoding('utf8');
            let body = '';
            corpusResponse.on('data', (chunk) => {
                body += chunk;
            });
            corpusResponse.on('end', () => resolve(body));
        });

        request.on('error', reject);
        request.setTimeout(10000, () => {
            request.destroy(new Error('Corpus request timed out'));
        });
    });
}

function serveStatic(requestPath, response) {
    const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(ROOT, safePath === '/' ? 'i.html' : safePath);

    if (!filePath.startsWith(ROOT)) {
        send(response, 403, 'Forbidden');
        return;
    }

    fs.readFile(filePath, (error, body) => {
        if (error) {
            send(response, 404, 'Not found');
            return;
        }

        const contentType = MIME_TYPES[path.extname(filePath)] || 'application/octet-stream';
        send(response, 200, body, contentType);
    });
}

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === '/health') {
        send(response, 200, 'ok');
        return;
    }

    if (url.pathname === '/corpus-wordbyword') {
        const chapter = Number(url.searchParams.get('chapter'));
        const verse = Number(url.searchParams.get('verse'));
        if (!Number.isInteger(chapter) || !Number.isInteger(verse) || chapter < 1 || chapter > 114 || verse < 1) {
            send(response, 400, 'Invalid chapter or verse');
            return;
        }
        try {
            const body = await fetchCorpusUrl(`/wordbyword.jsp?chapter=${chapter}&verse=${verse}`);
            send(response, 200, body, 'text/html; charset=utf-8');
        } catch (error) {
            console.error(error);
            send(response, 502, 'Unable to read Quranic Arabic Corpus');
        }
        return;
    }

    if (url.pathname === '/corpus-dictionary') {
        const q = url.searchParams.get('q');
        if (!q || !/^[a-zA-Z0-9*&<>}{|'\-]+$/.test(q)) {
            send(response, 400, 'Invalid root');
            return;
        }
        try {
            const body = await fetchCorpusUrl(`/qurandictionary.jsp?q=${encodeURIComponent(q)}`);
            send(response, 200, body, 'text/html; charset=utf-8');
        } catch (error) {
            console.error(error);
            send(response, 502, 'Unable to read Quranic Arabic Corpus');
        }
        return;
    }

    serveStatic(url.pathname, response);
});

server.listen(PORT, () => {
    console.log(`Quran reader running at http://localhost:${PORT}`);
});
