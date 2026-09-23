#!/usr/bin/env python3
"""
SSI-capable static file server.
Resolves <!--#include file="..." --> directives in .html files.

Usage:
    python ssi_server.py [port]          # default port 8000
    python ssi_server.py                 # serves on port 8000
    python ssi_server.py 8080            # serves on port 8080
"""

import io
import http.server
import os
import re
import socket
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

INCLUDE_RE = re.compile(r'<!--#include\s+file="([^"]+)"\s*-->')


class SSIHandler(http.server.SimpleHTTPRequestHandler):
    def _resolve_includes(self, rel_path, content, seen=None):
        seen = seen or set()
        root = os.path.dirname(rel_path)
        base = os.path.dirname(os.path.abspath(__file__))

        def repl(match):
            inc_rel = match.group(1)
            inc_abs = os.path.normpath(os.path.join(base, root, inc_rel))
            inc_rel_from_base = os.path.relpath(inc_abs, base)
            real = os.path.realpath(inc_abs)
            if not real.startswith(os.path.realpath(base)):
                return f'<!-- SSI error: path traversal blocked for "{inc_rel}" -->'
            if real in seen:
                return f'<!-- SSI error: circular include "{inc_rel}" -->'
            if not os.path.isfile(real):
                return f'<!-- SSI error: file not found: "{inc_rel}" -->'
            with open(real, encoding='utf-8') as f:
                sub = f.read()
            return self._resolve_includes(inc_rel_from_base, sub, seen | {real})

        return INCLUDE_RE.sub(repl, content)

    def guess_type(self, path):
        if path.endswith(('.html', '.htm')):
            return 'text/html; charset=utf-8'
        return super().guess_type(path)

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            for index in ('index.html', 'index.htm'):
                candidate = os.path.join(path, index)
                if os.path.isfile(candidate):
                    path = candidate
                    break
            else:
                return super().send_head()

        ctype = self.guess_type(path)

        try:
            if ctype.startswith('text/') or ctype.startswith('application/javascript'):
                with open(path, encoding='utf-8') as f:
                    content = f.read()
                rel_path = os.path.relpath(path, os.path.dirname(os.path.abspath(__file__)))
                content = self._resolve_includes(rel_path, content)
                body = content.encode('utf-8')
            else:
                with open(path, 'rb') as f:
                    body = f.read()
        except FileNotFoundError:
            self.send_error(404, 'File not found')
            return None
        except OSError:
            self.send_error(500, 'Internal server error')
            return None

        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Last-Modified', self.date_time_string())
        self.end_headers()

        return io.BytesIO(body)


class DualStackServer(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6


if __name__ == '__main__':
    host = '::' if socket.has_ipv6 else ''
    server_cls = DualStackServer if socket.has_ipv6 else http.server.ThreadingHTTPServer
    with server_cls((host, PORT), SSIHandler) as server:
        print(f'SSI server running at http://localhost:{PORT}')
        print('Serving with <!--#include --> support')
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\nServer stopped.')
