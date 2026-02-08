def test_create_budget(client, auth_headers, test_category):
    response = client.post("/budgets/", json={
        "month": "2026-02",
        "limit_amount": 400.00,
        "category_id": test_category.id,
    }, headers=auth_headers)

    assert response.status_code == 201
    data = response.json()
    assert data["month"] == "2026-02"
    assert data["limit_amount"] == 400.00
    assert data["category_id"] == test_category.id


def test_create_duplicate_budget(client, auth_headers, test_category):
    client.post("/budgets/", json={
        "month": "2026-02",
        "limit_amount": 400.00,
        "category_id": test_category.id,
    }, headers=auth_headers)

    response = client.post("/budgets/", json={
        "month": "2026-02",
        "limit_amount": 500.00,
        "category_id": test_category.id,
    }, headers=auth_headers)

    assert response.status_code == 400


def test_create_budget_invalid_category(client, auth_headers):
    response = client.post("/budgets/", json={
        "month": "2026-02",
        "limit_amount": 400.00,
        "category_id": 999,
    }, headers=auth_headers)

    assert response.status_code == 404


def test_get_budgets(client, auth_headers, test_category):
    client.post("/budgets/", json={
        "month": "2026-02",
        "limit_amount": 400.00,
        "category_id": test_category.id,
    }, headers=auth_headers)

    response = client.get("/budgets/", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


def test_get_budgets_filter_by_month(client, auth_headers, test_category):
    client.post("/budgets/", json={
        "month": "2026-02",
        "limit_amount": 400.00,
        "category_id": test_category.id,
    }, headers=auth_headers)

    response = client.get("/budgets/?month=2026-02", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

    response = client.get("/budgets/?month=2026-03", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0


def test_update_budget(client, auth_headers, test_category):
    create_response = client.post("/budgets/", json={
        "month": "2026-02",
        "limit_amount": 400.00,
        "category_id": test_category.id,
    }, headers=auth_headers)

    budget_id = create_response.json()["id"]

    response = client.put(f"/budgets/{budget_id}", json={
        "month": "2026-02",
        "limit_amount": 500.00,
        "category_id": test_category.id,
    }, headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["limit_amount"] == 500.00


def test_delete_budget(client, auth_headers, test_category):
    create_response = client.post("/budgets/", json={
        "month": "2026-02",
        "limit_amount": 400.00,
        "category_id": test_category.id,
    }, headers=auth_headers)

    budget_id = create_response.json()["id"]

    response = client.delete(f"/budgets/{budget_id}", headers=auth_headers)
    assert response.status_code == 204


def test_budget_requires_auth(client):
    response = client.get("/budgets/")

    assert response.status_code == 401