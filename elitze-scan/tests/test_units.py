from pathlib import Path

from elitze_scan import parsers, secrets
from elitze_scan.models import OBSERVED
from elitze_scan.patch import dependency_patch, secret_patch
from elitze_scan.teamspeak import escape


def test_requirements_exact_and_unpinned(tmp_path: Path):
    (tmp_path / "requirements.txt").write_text(
        "requests==2.31.0\nflask>=3.0\n# comment\n-e git+https://example.invalid/x.git\n",
        encoding="utf-8")
    pkgs = parsers.discover(tmp_path)
    by_name = {p.name: p for p in pkgs}
    assert by_name["requests"].version == "2.31.0"
    assert by_name["flask"].version is None
    assert len(pkgs) == 2


def test_dependency_patch_detects_major_jump():
    plan = dependency_patch("PyPI", "jinja2", "2.11.2", "3.1.6", "requirements.txt")
    assert plan is not None
    assert plan.target_version == "3.1.6"
    assert "major" in plan.blast_radius
    assert "jinja2>=3.1.6" in plan.command
    assert plan.rollback.startswith('pip install "jinja2==2.11.2"')


def test_no_fixed_version_means_no_plan():
    assert dependency_patch("PyPI", "x", "1.0", None, "requirements.txt") is None


def test_secret_patch_insists_on_rotation():
    plan = secret_patch("aws-akid", "app.py", 12)
    assert plan.strategy == "rotate-secret"
    assert any("rotate at the provider" in n for n in plan.notes)
    assert plan.command is None


def test_secret_scan_masks_value(tmp_path: Path):
    literal = "gh" + "p_" + "z" * 36
    (tmp_path / "leak.py").write_text(f'TOKEN = "{literal}"\n', encoding="utf-8")
    hits, inspected = secrets.scan_tree(tmp_path)
    assert inspected == 1
    assert len(hits) == 1
    assert hits[0]["line"] == 1
    assert literal not in hits[0]["masked"]
    assert hits[0]["masked"].startswith("ghp_")


def test_placeholder_values_are_not_findings(tmp_path: Path):
    (tmp_path / "conf.py").write_text('api_key = "your-key-here-placeholder"\n', encoding="utf-8")
    hits, _ = secrets.scan_tree(tmp_path)
    assert hits == []


def test_teamspeak_escape_matches_protocol():
    assert escape("a b|c/d") == "a\\sb\\pc\\/d"
    assert escape("line\nbreak") == "line\\nbreak"
