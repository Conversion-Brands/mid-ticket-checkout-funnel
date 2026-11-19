"""Local server for the Figma Desktop Bridge: GET serves graphics/ (scripts in /figma, briefs in /briefs),
POST saves the body as a file in graphics/figma/exports/.

Usage, from the repository root:  python3 graphics/figma/serve.py 9231
The bridge plugin may only fetch http://localhost on ports 9223 to 9232 (9223-9227 are often taken
by the MCP servers themselves), so pick a free port in that range. Exports land in graphics/figma/exports/.
"""
import http.server
import os
import socket
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 9231
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)  # graphics/
OUT = os.path.join(HERE, 'exports')
os.makedirs(OUT, exist_ok=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        name = os.path.basename(self.path.split('?')[0]) or 'upload.bin'
        data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        with open(os.path.join(OUT, name), 'wb') as f:
            f.write(data)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'ok')

    def log_message(self, *args):
        pass


class DualStack(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        super().server_bind()


os.chdir(ROOT)
print(f'serving {ROOT} on http://localhost:{PORT}/ (exports go to {OUT})')
DualStack(('::', PORT), Handler).serve_forever()
