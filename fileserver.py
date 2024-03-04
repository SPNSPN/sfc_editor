#! python3
#! -*- coding: cp932 -*-

import sys
from http.server import SimpleHTTPRequestHandler, HTTPServer, test

class CORSRequestHandler (SimpleHTTPRequestHandler):
    def end_headers (self):
        self.send_header("Access-Control-Allow-Origin", "*")
        SimpleHTTPRequestHandler.end_headers(self)

if __name__ == "__main__":
    test(CORSRequestHandler, HTTPServer, port = 8000)
