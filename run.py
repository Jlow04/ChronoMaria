"""Start all ChronoMaria services with a single command.

Usage:
    python run.py
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def _resolve_executable(name: str) -> str:
    """Resolve command paths reliably, including .cmd tools on Windows."""
    candidates = [name]
    if sys.platform.startswith("win") and not name.lower().endswith(".cmd"):
        candidates.insert(0, f"{name}.cmd")

    for candidate in candidates:
        path = shutil.which(candidate)
        if path:
            return path

    return name


def _python_for_ga() -> str:
    """Use the current Python; fallback to common Windows path if available."""
    windows_fallback = Path("C:/python314/python.exe")
    if windows_fallback.exists():
        return str(windows_fallback)
    return sys.executable


SERVICES: list[tuple[str, Path, list[str]]] = [
    ("Backend", ROOT / "backend", [_resolve_executable("npm"), "start"]),
    ("Frontend", ROOT / "frontend", [_resolve_executable("npm"), "run", "dev"]),
    ("Python GA", ROOT / "genetic_algorithm", [_python_for_ga(), "server.py"]),
]


def stream_output(service_name: str, process: subprocess.Popen[str]) -> None:
    assert process.stdout is not None
    for line in process.stdout:
        print(f"[{service_name}] {line.rstrip()}", flush=True)


def validate_requirements() -> None:
    missing_dirs = [str(path) for _, path, _ in SERVICES if not path.exists()]
    if missing_dirs:
        print("Missing service directories:")
        for path in missing_dirs:
            print(f"  - {path}")
        raise SystemExit(1)

    if shutil.which("npm") is None:
        print("Error: npm was not found in PATH. Install Node.js and try again.")
        raise SystemExit(1)


def main() -> int:
    validate_requirements()

    print("Starting ChronoMaria services...", flush=True)
    processes: list[tuple[str, subprocess.Popen[str]]] = []
    threads: list[threading.Thread] = []

    try:
        for name, cwd, command in SERVICES:
            process = subprocess.Popen(
                command,
                cwd=str(cwd),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
                bufsize=1,
            )
            processes.append((name, process))

            thread = threading.Thread(
                target=stream_output,
                args=(name, process),
                daemon=True,
            )
            thread.start()
            threads.append(thread)

        print("All services started.", flush=True)
        print("Frontend: http://localhost:3000", flush=True)
        print("Backend:  http://localhost:5000", flush=True)
        print("Python GA: http://localhost:8000", flush=True)
        print("Press Ctrl+C to stop all services.", flush=True)

        while True:
            for name, process in processes:
                code = process.poll()
                if code is not None:
                    print(f"{name} exited with code {code}. Shutting down everything...", flush=True)
                    raise KeyboardInterrupt
            time.sleep(1)

    except KeyboardInterrupt:
        print("Stopping services...", flush=True)
        for _, process in reversed(processes):
            if process.poll() is None:
                process.terminate()

        deadline = time.time() + 5
        for _, process in processes:
            while process.poll() is None and time.time() < deadline:
                time.sleep(0.1)
            if process.poll() is None:
                process.kill()

    finally:
        for thread in threads:
            thread.join(timeout=0.5)

    print("All services stopped.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
