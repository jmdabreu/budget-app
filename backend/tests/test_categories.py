def test_create_category(client, auth_headers):
    response = client.post("/categories/", json={
        "name": "Food",
        "type": "expense",
    }, headers=auth_headers)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Food"
    assert data["type"] == "expense"
    assert "id" in data


def test_create_category_invalid_type(client, auth_headers):
    response = client.post("/categories/", json={
        "name": "Other",
        "type": "other",
    }, headers=auth_headers)

    assert response.status_code == 400


def test_get_categories(client, auth_headers, test_category):
    response = client.get("/categories/", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Food"


def test_get_single_category(client, auth_headers, test_category):
    response = client.get(f"/categories/{test_category.id}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["name"] == "Food"


def test_get_category_not_found(client, auth_headers):
    response = client.get("/categories/999", headers=auth_headers)

    assert response.status_code == 404


def test_update_category(client, auth_headers, test_category):
    response = client.put(f"/categories/{test_category.id}", json={
        "name": "Groceries",
        "type": "expense",
    }, headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["name"] == "Groceries"


def test_delete_category(client, auth_headers, test_category):
    response = client.delete(f"/categories/{test_category.id}", headers=auth_headers)

    assert response.status_code == 204

    response = client.get(f"/categories/{test_category.id}", headers=auth_headers)
    assert response.status_code == 404


def test_category_requires_auth(client):
    response = client.get("/categories/")

    assert response.status_code == 401