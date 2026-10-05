from app.services.ocr_service import _fallback_heuristic_extraction


def test_fallback_does_not_invent_total_amount_without_explicit_total_label():
    extracted = _fallback_heuristic_extraction("receipt_20260301.png", b"not-a-real-image")

    assert extracted["documentType"] == "OFFICIAL_RECEIPT"
    assert extracted["amount"] is None
    assert extracted["clientName"] == "Customer Name Not Read"
