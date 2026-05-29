from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(tags=["auth"])


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


class UserInfo(BaseModel):
    name: str
    email: str


class LoginResponse(BaseModel):
    token: str
    user: UserInfo


# ---------------------------------------------------------------------------
# Hardcoded user store (prototype only — not for production)
# ---------------------------------------------------------------------------

_USERS: dict[str, dict] = {
    "demo@anglepoint.com": {
        "password": "anglepoint2025",
        "name": "Demo User",
    },
    "natalie.castro@anglepoint.com": {
        "password": "anglepoint2025",
        "name": "Natalie Castro",
    },
}

_MOCK_TOKEN = "mock-jwt-token"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest) -> LoginResponse:
    """Authenticate a user and return a mock JWT token."""
    user = _USERS.get(body.email)
    if user is None or user["password"] != body.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    return LoginResponse(
        token=_MOCK_TOKEN,
        user=UserInfo(name=user["name"], email=body.email),
    )


@router.post("/me", response_model=UserInfo)
async def me() -> UserInfo:
    """Return the mock authenticated user (no real JWT validation for prototype)."""
    # For the prototype we always return the demo user; a real implementation
    # would decode the Authorization header and look up the user.
    return UserInfo(
        name="Demo User",
        email="demo@anglepoint.com",
    )
