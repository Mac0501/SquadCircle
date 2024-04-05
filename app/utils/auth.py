from sanic_jwt import exceptions
from app.db.models import User
from sanic.response import json
from sanic_jwt import BaseEndpoint

class Register(BaseEndpoint):
    async def post(self, request, *args, **kwargs):
        name = request.json.get('name', None)
        password = request.json.get('password', None)

        name_exists = await User.exists(name=name)

        if name_exists:
            return json({'message': 'Username already exists'}, status=400)
        else:
            user = await User.create(name=name, password= User.hash_password(password))

            access_token, output = await self.responses.get_access_token_output(
                request,
                user,
                self.config,
                self.instance)

            response = self.responses.get_token_response(
                request,
                access_token,
                output,
                config=self.config)
            
            return response

async def retrieve_user(request, payload, *args, **kwargs):
    if payload:
        user = await User.get_or_none(id=payload.get('id', None))
        return user
    else:
        return None


async def authenticate(request, *args, **kwargs):
    name = request.json.get("name", None)
    password = request.json.get("password", None)

    if not name or not password:
        raise exceptions.AuthenticationFailed("Missing name or password.")

    user = await User.get_or_none(name=name)
    if user is None:
        raise exceptions.AuthenticationFailed("User not found.")

    if not user.verify_password(password):
        raise exceptions.AuthenticationFailed("Password is incorrect.")

    return user