def test_register_login_and_me(client) -> None:
    """
    회원가입 → 로그인 → /me 호출까지 기본 인증 플로우가 동작하는지 검증.
    """
    # 회원가입
    resp_reg = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "name": "테스트",
            "password": "password123",
        },
    )
    assert resp_reg.status_code == 200

    # 로그인
    resp_login = client.post(
        "/api/auth/login",
        data={
            "username": "test@example.com",
            "password": "password123",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp_login.status_code == 200
    token = resp_login.json()["access_token"]
    assert token

    # /me
    resp_me = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp_me.status_code == 200
    data = resp_me.json()
    assert data["email"] == "test@example.com"

