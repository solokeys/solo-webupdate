from http.server import HTTPServer, SimpleHTTPRequestHandler
import ssl

# U2F requires serving over https
# WebAuthn does not
https = False

host = "localhost"
port = 8443 if https else 8080
protocol = f"http{'s' if https else ''}"
url = f"{protocol}://{host}:{port}"

httpd = HTTPServer((host, port), SimpleHTTPRequestHandler)

if https:
    httpd.socket = ssl.wrap_socket(
        httpd.socket,
        keyfile="localhost.key",
        certfile="localhost.crt",
        server_side=True,
    )

print(f"serving on {url}")
httpd.serve_forever()
