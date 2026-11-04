import tomllib
from pathlib import Path

from elitze_scan.models import TOOL_VERSION

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))


def test_version_in_manifest_matches_engine():
    assert MANIFEST["project"]["version"] == TOOL_VERSION


def test_entry_point_matches_callable():
    scripts = MANIFEST["project"]["scripts"]
    assert scripts["elitze-scan"] == "elitze_scan.cli:main"


def test_readme_exists_and_is_declared():
    assert MANIFEST["project"]["readme"] == "README.md"
    text = (ROOT / "README.md").read_text(encoding="utf-8")
    assert len(text) > 2000
    assert "no-downgrade" in text.lower() or "never a downgrade" in text.lower()


def test_wheel_targets_the_package():
    wheel = MANIFEST["tool"]["hatch"]["build"]["targets"]["wheel"]
    assert wheel["packages"] == ["elitze_scan"]
    assert (ROOT / "elitze_scan" / "__init__.py").exists()


def test_runtime_dependencies_are_declared():
    deps = MANIFEST["project"]["dependencies"]
    assert any(d.startswith("httpx") for d in deps)
    extras = MANIFEST["project"]["optional-dependencies"]
    assert "pytest" in " ".join(extras["dev"])
    assert any("fastapi" in d for d in extras["api"])
