from elitze_scan.cvss import base_score


def test_rce_vector_scores_nine_eight():
    assert base_score("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H") == 9.8


def test_scope_changed_vector():
    # Log4Shell-style vector.
    assert base_score("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H") == 10.0


def test_medium_vector():
    assert base_score("CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N") == 5.4


def test_zero_impact_is_zero():
    assert base_score("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N") == 0.0


def test_non_v3_vector_returns_none():
    assert base_score("CVSS:2.0/AV:N/AC:L/Au:N/C:P/I:P/A:P") is None
    assert base_score("") is None
    assert base_score("CVSS:3.1/AV:X/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H") is None
