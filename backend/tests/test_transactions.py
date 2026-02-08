def test_create_transaction(client, auth_headers, test_category):
    response = client.post("/transactions/", json={
        "amount": 25.50,
        "description": "Groceries",
        "date": "2026-02-07",
        "category_id": test_category.id,
    }, headers=auth_headers)

    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 25.50
    assert data["description"] == "Groceries"
    assert data["category_id"] == test_category.id


def test_create_transaction_invalid_category(client, auth_headers):
    response = client.post("/transactions/", json={
        "amount": 25.50,
        "description": "Test",
        "date": "2026-02-07",
        "category_id": 999,
    }, headers=auth_headers)

    assert response.status_code == 404


def test_get_transactions(client, auth_headers, test_category):
    client.post("/transactions/", json={
        "amount": 25.50,
        "description": "Groceries",
        "date": "2026-02-07",
        "category_id": test_category.id,
    }, headers=auth_headers)

    client.post("/transactions/", json={
        "amount": 15.00,
        "description": "Snacks",
        "date": "2026-02-06",
        "category_id": test_category.id,
    }, headers=auth_headers)

    response = client.get("/transactions/", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_get_transactions_filter_by_category(client, auth_headers, test_category, test_income_category):
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

    response = client.get(f"/transactions/?category_id={test_category.id}", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["description"] == "Groceries"


def test_update_transaction(client, auth_headers, test_category):
    create_response = client.post("/transactions/", json={
        "amount": 25.50,
        "description": "Groceries",
        "date": "2026-02-07",
        "category_id": test_category.id,
    }, headers=auth_headers)

    transaction_id = create_response.json()["id"]

    response = client.put(f"/transactions/{transaction_id}", json={
        "amount": 30.00,
        "description": "Groceries (updated)",
    }, headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["amount"] == 30.00
    assert response.json()["description"] == "Groceries (updated)"


def test_delete_transaction(client, auth_headers, test_category):
    create_response = client.post("/transactions/", json={
        "amount": 25.50,
        "description": "Groceries",
        "date": "2026-02-07",
        "category_id": test_category.id,
    }, headers=auth_headers)

    transaction_id = create_response.json()["id"]

    response = client.delete(f"/transactions/{transaction_id}", headers=auth_headers)
    assert response.status_code == 204

    response = client.get(f"/transactions/{transaction_id}", headers=auth_headers)
    assert response.status_code == 404


def test_transaction_requires_auth(client):
    response = client.get("/transactions/")

    assert response.status_code == 401