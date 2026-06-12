from __future__ import annotations

import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from math_for_ai.curriculum import CURRICULUM
from math_for_ai.experiments import EXPERIMENTS, run_experiment


STATIC_ROOT = Path(__file__).resolve().parent / "static"
CONTENT_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
}


class MathLabHandler(BaseHTTPRequestHandler):
    server_version = "MathForAILab/0.1"

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/health":
            self._send_json({"status": "ok"})
            return
        if path == "/api/state":
            initial = {
                name: run_experiment(name)
                for name in ("linear", "calculus", "optimization")
            }
            self._send_json(
                {
                    "curriculum": CURRICULUM,
                    "experiments": {
                        name: {
                            key: value
                            for key, value in definition.items()
                            if key != "runner"
                        }
                        for name, definition in EXPERIMENTS.items()
                    },
                    "initial": initial,
                }
            )
            return
        self._serve_static(path)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path != "/api/experiment":
            self._send_json({"error": "Unknown API endpoint"}, status=404)
            return
        try:
            payload = self._read_json()
            name = str(payload.get("name", ""))
            parameters = payload.get("parameters", {})
            if not isinstance(parameters, dict):
                raise ValueError("parameters must be an object")
            self._send_json(run_experiment(name, parameters))
        except (TypeError, ValueError, json.JSONDecodeError) as exc:
            self._send_json({"error": str(exc)}, status=400)

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"[math-for-ai] {self.address_string()} - {fmt % args}")

    def _read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        value = json.loads(self.rfile.read(length) or b"{}")
        if not isinstance(value, dict):
            raise ValueError("JSON body must be an object")
        return value

    def _serve_static(self, path: str) -> None:
        relative = "index.html" if path in {"", "/"} else path.lstrip("/")
        candidate = (STATIC_ROOT / relative).resolve()
        if STATIC_ROOT.resolve() not in candidate.parents or not candidate.is_file():
            self.send_error(404)
            return
        data = candidate.read_bytes()
        self.send_response(200)
        self.send_header(
            "Content-Type",
            CONTENT_TYPES.get(candidate.suffix, "application/octet-stream"),
        )
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _send_json(self, value: Any, status: int = 200) -> None:
        data = json.dumps(value).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Math for AI visual laboratory.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8771, type=int)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), MathLabHandler)
    print(f"Math for AI Lab: http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

