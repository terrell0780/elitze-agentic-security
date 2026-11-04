"""TeamSpeak 3 notification adapter.

Real ServerQuery over TCP — the same interface ts3admin uses. If credentials are absent the
adapter reports NOT_CONFIGURED instead of pretending a message was delivered.
"""
from __future__ import annotations

import os
import socket
from dataclasses import dataclass

_ESCAPE = {"\\": "\\\\", "/": "\\/", " ": "\\s", "|": "\\p", "\n": "\\n", "\r": "\\r",
           "\t": "\\t", "\a": "\\a", "\b": "\\b", "\f": "\\f", "\v": "\\v"}


def escape(value: str) -> str:
    return "".join(_ESCAPE.get(ch, ch) for ch in value)


@dataclass
class TeamSpeakConfig:
    host: str
    port: int
    user: str
    password: str
    server_id: int
    channel_id: int

    @classmethod
    def from_env(cls) -> "TeamSpeakConfig | None":
        host = os.environ.get("TS3_HOST")
        password = os.environ.get("TS3_QUERY_PASSWORD")
        if not host or not password:
            return None
        return cls(
            host=host,
            port=int(os.environ.get("TS3_QUERY_PORT", "10011")),
            user=os.environ.get("TS3_QUERY_USER", "serveradmin"),
            password=password,
            server_id=int(os.environ.get("TS3_SERVER_ID", "1")),
            channel_id=int(os.environ.get("TS3_CHANNEL_ID", "1")),
        )


class TeamSpeakNotifier:
    def __init__(self, config: TeamSpeakConfig | None, timeout: float = 8.0) -> None:
        self.config = config
        self.timeout = timeout

    def send(self, message: str) -> dict[str, object]:
        if self.config is None:
            return {"status": "NOT_CONFIGURED",
                    "detail": "set TS3_HOST and TS3_QUERY_PASSWORD to enable delivery",
                    "delivered": False}
        body = escape(message[:8000])
        try:
            with socket.create_connection((self.config.host, self.config.port), timeout=self.timeout) as sock:
                sock.settimeout(self.timeout)
                self._read_until(sock, "TS3")
                self._command(sock, f"login {self.config.user} {self.config.password}")
                self._command(sock, f"use sid={self.config.server_id}")
                self._command(sock, f"sendtextmessage targetmode=2 target={self.config.channel_id} msg={body}")
                self._command(sock, "quit")
            return {"status": "SENT", "detail": f"delivered to channel {self.config.channel_id}",
                    "delivered": True}
        except OSError as exc:
            return {"status": "ERROR", "detail": f"{type(exc).__name__}: {exc}", "delivered": False}

    # ---------- protocol ----------

    def _read_until(self, sock: socket.socket, marker: str) -> str:
        buffer = b""
        while marker.encode() not in buffer:
            chunk = sock.recv(4096)
            if not chunk:
                break
            buffer += chunk
        return buffer.decode("utf-8", errors="replace")

    def _command(self, sock: socket.socket, command: str) -> str:
        sock.sendall((command + "\n").encode("utf-8"))
        response = self._read_until(sock, "error id=")
        if "error id=0" not in response:
            raise OSError(f"ServerQuery rejected '{command.split(' ')[0]}': "
                          f"{response.strip().splitlines()[-1][:160]}")
        return response
