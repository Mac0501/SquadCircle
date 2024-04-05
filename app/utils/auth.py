from sanic_jwt import exceptions
from app.db.models import User

async def retrieve_user(request, payload, *args, **kwargs):
    if payload:
        user = await User.get_or_none(id=payload.get('id', None))
        return user
    else:
        return None


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