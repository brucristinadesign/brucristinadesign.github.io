#!/usr/bin/env python3
import http.server
import os

port = int(os.environ.get("PORT", 4321))
os.chdir("/Users/brunacristina/Documents/Claude/Projects/MARCA PESSOAL")

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

with http.server.HTTPServer(("", port), Handler) as httpd:
    httpd.serve_forever()
