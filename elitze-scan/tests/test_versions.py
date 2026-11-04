from elitze_scan.patch import is_upgrade, version_tuple


def test_version_tuple_handles_prerelease_and_partial():
    assert version_tuple("8.10.2") == (8, 10, 2)
    assert version_tuple("1.2") == (1, 2, 0)
    assert version_tuple("2.0.0-beta.3") == (2, 0, 0)
    assert version_tuple(None) == (0, 0, 0)


def test_older_fix_is_not_an_upgrade():
    # undici 8.10.2 with an advisory whose fix targets the 6.x line must not be "fixed"
    # by downgrading.
    assert is_upgrade("8.10.2", "6.29.1") is False
    assert is_upgrade("8.10.2", "7.30.1") is False
    assert is_upgrade("8.10.2", "8.10.3") is True
    assert is_upgrade("8.10.2", "8.10.2") is False
    assert is_upgrade(None, "1.0.0") is True
