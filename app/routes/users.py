import os
from sanic import Blueprint, file
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json 
from tortoise.transactions import atomic
from app.db.models import User
from app.utils.decorators import is_owner

users = Blueprint("users", url_prefix="/users")


@users.route("/", methods=["GET"])
@protected()
@is_owner()
async def get_users(request: Request, my_user: User):
    users = await User.all()
    return json([user.to_dict() for user in users])


@users.route("/<user_id:int>", methods=["GET"])
@protected()
async def get_user(request: Request, my_user: User, user: User|None):
    if user:
        return json(user.to_dict())
    else:
        return json({"error": f"User with ID {user.id} not found"}, status=404)


@users.route("/<user_id:int>", methods=["DELETE"])
@protected()
@is_owner()
@atomic()
async def delete_user(request: Request, my_user: User, user: User|None):
    if user:
        await user.delete()
        return json({"message": f"User deleted successfully"})
    else:
        return json({"error": f"User not found"}, status=404)
    

@users.route("/<user_id:int>/avatar", methods=["GET"])
@protected()
async def get_avatar(request: Request, my_user: User, user: User|None):
    if user:
        avatar_path = f"{request.app.ctx.Config['Resources']['users']}/{user.id}/avatar.png"
        if os.path.isfile(avatar_path):
            try:
                return await file(avatar_path)
            except FileNotFoundError:
                return json({"error": "Avatar not found"}, status=404)
        else:
            return json({"error": "Avatar file not found"}, status=404)
    else:
        return json({"error": f"User not found"}, status=404)
    

@users.route("/<user_id:int>/groups", methods=["GET"])
@protected()
@is_owner()
async def get_user_groups(request: Request, my_user: User, user: User|None):
    if not user:
        return json({"error": f"User not found"}, status=404)
    
    await user.fetch_related("groups")
    
    return json([group.to_dict() for group in user.groups])