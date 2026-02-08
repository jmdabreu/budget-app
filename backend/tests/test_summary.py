def test_monthly_summary(client, auth_headers, test_category, test_income_category):
    client.post("/transactions/", json={
        "amount": 25.50,
        "description": "Groceries",
        "date": "2026-02-07",
        "category_id": test_category.id,
    }, headers=auth_headers)

    client.post("/transactions/", json={
        "amount": 3000.00,
        "description": "Salary",
        "date": "2026-02-01",
        "category_id": test_income_category.id,
    }, headers=auth_headers)

    client.post("/budgets/", json={
        "month": "2026-02",
        "limit_amount": 400.00,
        "category_id": test_category.id,
    }, headers=auth_headers)

    response = client.get("/summary/monthly/2026-02", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["month"] == "2026-02"
    assert data["total_income"] == 3000.00
    assert data["total_spent"] == 25.50
    assert data["net"] == 2974.50
    assert len(data["categories"]) >= 1

    food = next(c for c in data["categories"] if c["name"] == "Food")
    assert food["spent"] == 25.50
    assert food["limit"] == 400.00
    assert food["status"] == "under_budget"


def test_monthly_summary_invalid_format(client, auth_headers):
    response = client.get("/summary/monthly/February", headers=auth_headers)

    assert response.status_code == 400


def test_alerts_no_alerts(client, auth_headers, test_category):
    client.post("/budgets/", json={
        "month": "2026-02",
        "limit_amount": 400.00,
        "category_id": test_category.id,
    }, headers=auth_headers)

    response = client.get("/summary/alerts/2026-02", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["alert_count"] == 0


def test_alerts_near_limit(client, auth_headers, test_category, test_income_category):
    client.post("/budgets/", json={
        "month": "2026-02",
        "limit_amount": 100.00,
        "category_id": test_category.id,
    }, headers=auth_headers)

    client.post("/transactions/", json={
        "amount": 85.00,
        "description": "Big grocery trip",
        "date": "2026-02-07",
        "category_id": test_category.id,
    }, headers=auth_headers)

    client.post("/transactions/", json={
        "amount": 5000.00,
        "description": "Salary",
        "date": "2026-02-01",
        "category_id": test_income_category.id,
    }, headers=auth_headers)

    response = client.get("/summary/alerts/2026-02", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["alert_count"] == 1
    assert data["alerts"][0]["severity"] == "warning"


def test_alerts_over_budget(client, auth_headers, test_category, test_income_category):
    client.post("/budgets/", json={
        "month": "2026-02",
        "limit_amount": 100.00,
        "category_id": test_category.id,
    }, headers=auth_headers)

    client.post("/transactions/", json={
        "amount": 150.00,
        "description": "Over spending",
        "date": "2026-02-07",
        "category_id": test_category.id,
    }, headers=auth_headers)

    client.post("/transactions/", json={
        "amount": 5000.00,
        "description": "Salary",
        "date": "2026-02-01",
        "category_id": test_income_category.id,
    }, headers=auth_headers)

    response = client.get("/summary/alerts/2026-02", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["alert_count"] == 1
    assert data["alerts"][0]["severity"] == "high"


def test_summary_requires_auth(client):
    response = client.get("/summary/monthly/2026-02")

    assert response.status_code == 401