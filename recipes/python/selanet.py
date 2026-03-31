"""
Selanet Python SDK — Node Bridge

Spawns a single Node.js process (bridge.ts) and communicates via
JSON Lines over stdin/stdout. Reuses the TypeScript parsing logic
so there is only one codebase to maintain.

Usage:
    from selanet import Selanet

    with Selanet() as sela:
        tokens = sela.run("coingecko/token_prices")
        print(tokens[0]["name"])
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

# Load .env from project root (selanet-web3-receipes/.env)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _PROJECT_ROOT / ".env"

if _ENV_FILE.exists():
    with open(_ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            key, _, value = line.partition("=")
            if key and value:
                os.environ.setdefault(key.strip(), value.strip())

BRIDGE_DIR = Path(__file__).resolve().parent.parent / "typescript"
BRIDGE_CMD = ["npx", "tsx", "bridge.ts"]


class SelanetError(Exception):
    pass


class Selanet:
    def __init__(self):
        self._proc: subprocess.Popen | None = None
        self._start()

    def _start(self):
        self._proc = subprocess.Popen(
            BRIDGE_CMD,
            cwd=str(BRIDGE_DIR),
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env={**os.environ},
        )
        # Wait for ready signal
        ready = self._read_response()
        if not ready.get("ready"):
            raise SelanetError(f"Bridge failed to start: {ready}")

    def _read_response(self) -> dict:
        assert self._proc and self._proc.stdout
        while True:
            line = self._proc.stdout.readline()
            if not line:
                stderr = ""
                if self._proc.stderr:
                    stderr = self._proc.stderr.read().decode(errors="replace")
                raise SelanetError(f"Bridge process died. stderr: {stderr}")
            line = line.decode(errors="replace").strip()
            if not line:
                continue
            # Skip non-JSON lines (e.g. npx warnings)
            if line.startswith("{"):
                return json.loads(line)


    def _send_request(self, obj: dict):
        assert self._proc and self._proc.stdin
        data = json.dumps(obj) + "\n"
        self._proc.stdin.write(data.encode())
        self._proc.stdin.flush()

    def run(self, recipe: str) -> list | dict:
        """Run a recipe and return parsed JSON result."""
        self._send_request({"recipe": recipe})
        resp = self._read_response()
        if not resp.get("ok"):
            raise SelanetError(resp.get("error", "Unknown error"))
        return resp["result"]

    def close(self):
        if self._proc:
            self._proc.terminate()
            self._proc.wait(timeout=5)
            self._proc = None

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()
