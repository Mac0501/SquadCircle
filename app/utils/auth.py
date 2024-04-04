import hashlib
from sanic_jwt import exceptions
from app.db.models import User

async def authenticate(request, *args, **kwargs):
    username = request.json.get("username", None)
    password = request.json.get("password", None)

    if not username or not password:
        raise exceptions.AuthenticationFailed("Missing username or password.")

    user = await User.get_or_none(name=username)
    if user is None:
        raise exceptions.AuthenticationFailed("User not found.")

    if not user.verify_password(password):
        raise exceptions.AuthenticationFailed("Password is incorrect.")

    return user