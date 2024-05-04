from sanic import Request
from sanic_jwt import exceptions
from app.db.models import Invite, User, UserAndGroup
from sanic.response import json
from sanic_jwt import BaseEndpoint

class Register(BaseEndpoint):
    async def post(self, request: Request, *args, **kwargs):
        code = request.json.get("code", None)
        if not code:
            return json({'message': 'Missing invite code'}, status=400)
        
        if len(code) > 16:
            return json({'message': 'Invite code doesnt exists'}, status=404)
        
        invite = await Invite.get_or_none(code=code)
        if not invite or invite.is_expired():
            if invite:
                await invite.delete()
            return json({'message': 'Invite code doesnt exists'}, status=404)

        name = request.json.get('name', None)
        if not name:
            return json({'message': 'Missing name'}, status=400)
        
        password = request.json.get('password', None)
        if not password:
            return json({'message': 'Missing password'}, status=400)

        name_exists = await User.exists(name=name)

        if name_exists:
            return json({'message': 'Username already exists'}, status=400)
        else:
            user = await User.create(name=name, password= User.hash_password(password))
            user_and_group = await UserAndGroup.create(user_id=user.id, group_id=invite.group_id)
            await invite.delete()
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

class Logout(BaseEndpoint):
    async def post(self, request: Request, *args, **kwargs):
        response = json({"message": "Logged out successfully"})
        if "access_token" in request.cookies:
            response.delete_cookie("access_token")
            
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