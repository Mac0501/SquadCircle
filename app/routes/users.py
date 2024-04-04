import os
from sanic import Blueprint, file
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import User

users = Blueprint("users", url_prefix="/users")

@users.route("/", methods=["GET"])
@protected()
async def get_users(request: Request):
    users = await User.all()
    return json([user.to_dict() for user in users])


# @users.route("/", methods=["POST"])
# @protected()
# @atomic()
# async def create_user(request: Request):
#     data = request.json
#     user = await User.create(**data)
#     return json(user.to_dict(), status=201)


@users.route("/<user_id:int>", methods=["GET"])
@protected()
async def get_user(request: Request, user_id: int):
    user = await User.get_or_none(id=user_id)
    if user:
        return json(user.to_dict())
    else:
        return json({"error": f"User with ID {user_id} not found"}, status=404)


@users.route("/<user_id:int>", methods=["PUT"])
@protected()
@atomic()
async def update_user(request: Request, user_id: int):
    data = request.json
    user = await User.get_or_none(id=user_id)
    if user:
        await user.update_from_dict(data)
        return json(user.to_dict())
    else:
        return json({"error": f"User with ID {user_id} not found"}, status=404)


@users.route("/<user_id:int>", methods=["DELETE"])
@protected()
@atomic()
async def delete_user(request: Request, user_id: int):
    user = await User.get_or_none(id=user_id)
    if user:
        await user.delete()
        return json({"message": f"User with ID {user_id} deleted successfully"})
    else:
        return json({"error": f"User with ID {user_id} not found"}, status=404)
    

@users.route("/<user_id:int>/upload_avatar", methods=["POST"])
@protected()
async def upload_avatar(request: Request, user_id: int):
    user = await User.get_or_none(id=user_id)
    if user:
        uploaded_files = await request.files
        if "avatar" in uploaded_files:
            avatar_file = uploaded_files["avatar"][0]
            os.makedirs(f"{request.app.ctx.Config['Resources']['users']}/{user_id}", exist_ok=True)
            avatar_path = f"/{request.app.ctx.Config['Resources']['users']}/{user_id}/avatar.png"

            with open(avatar_path, "wb") as f:
                f.write(avatar_file.body)

            return json({"message": "Avatar uploaded successfully"})
        else:
            return json({"error": "Avatar file not found in the request"}, status=400)
    else:
        return json({"error": f"User with ID {user_id} not found"}, status=404)
    

@users.route("/<user_id:int>/avatar.png", methods=["GET"])
@protected()
async def get_avatar(request: Request, user_id: int):
    user = await User.exists(id=user_id)
    if user:
        # Construct the full path to the avatar image file
        avatar_path = f"{request.app.ctx.Config['Resources']['users']}/{user_id}/avatar.png"
        if os.path.isfile(avatar_path):
            try:
                # Send the avatar image file as a response
                return await file(avatar_path)
            except FileNotFoundError:
                return json({"error": "Avatar not found"}, status=404)
        else:
            return json({"error": "Avatar file not found"}, status=404)
    else:
        return json({"error": f"User with ID {user_id} not found"}, status=404)
    

@users.route("/<user_id:int>/groups", methods=["GET"])
@protected()
async def get_user_groups(request: Request, user_id: int):
    user = await User.get_or_none(id=user_id)
    if not user:
        return json({"error": f"User with ID {user_id} not found"}, status=404)
    
    await user.fetch_related("groups")
    
    return json([group.to_dict() for group in user.groups])