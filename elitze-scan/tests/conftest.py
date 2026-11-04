import os
import tempfile
from pathlib import Path

_ROOT = Path(tempfile.mkdtemp(prefix="elitze-scan-tests-"))
os.environ["ELITZE_DATA_DIR"] = str(_ROOT / "data")
os.environ["ELITZE_SCAN_ROOT"] = str(_ROOT / "root")
(_ROOT / "root" / "sample").mkdir(parents=True, exist_ok=True)

# A target with four real, reproducible defects.
SAMPLE = _ROOT / "root" / "sample"
(SAMPLE / "requirements.txt").write_text("requests==2.31.0\nflask\n", encoding="utf-8")
(SAMPLE / "Dockerfile").write_text("FROM python:latest\nWORKDIR /app\n", encoding="utf-8")
(SAMPLE / ".env").write_text("PLACEHOLDER=1\n", encoding="utf-8")
_FAKE_KEY = "AKIA" + "Q" * 16
(SAMPLE / "settings.py").write_text(f'AWS_ACCESS_KEY_ID = "{_FAKE_KEY}"\n', encoding="utf-8")
