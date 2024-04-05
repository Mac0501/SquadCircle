import os
from sanic import Blueprint, file
from sanic_jwt import inject_user, protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import User, UserAndGroup, UserEventOptionResponse, EventOption

me = Blueprint("me", url_prefix="/users/me")


@me.route("/", methods=["GET"])
@inject_user()
@protected()
async def get_me(request: Request, user: User):
    if user:
        return json(user.to_dict())
    else:
        return json({"error": f"Not Existing"}, status=404)
    

@me.route("/groups", methods=["GET"])
@inject_user()
@protected()
async def get_me_groups(request: Request, user: User):
    await user.fetch_related("groups")
    
    return json([group.to_dict() for group in user.groups])


@me.route("/groups/<group_id:int>/permissions", methods=["GET"])
@inject_user()
@protected()
async def get_me_groups_permissions(request: Request, user: User, group_id: int):
    user_and_group = await UserAndGroup.get_or_none(user_id= user.id, group_id=group_id).prefetch_related("user_group_permissions")
    
    return json([user_group_permission.to_dict() for user_group_permission in user_and_group.user_group_permissions])


@me.route("/upload_avatar", methods=["POST"])
@protected()
async def upload_avatar(request: Request, user: User):
    if user:
        uploaded_files = await request.files
        if "avatar" in uploaded_files:
            avatar_file = uploaded_files["avatar"][0]
            os.makedirs(f"{request.app.ctx.Config['Resources']['users']}/{user.id}", exist_ok=True)
            avatar_path = f"/{request.app.ctx.Config['Resources']['users']}/{user.id}/avatar.png"

            with open(avatar_path, "wb") as f:
                f.write(avatar_file.body)

            return json({"message": "Avatar uploaded successfully"})
        else:
            return json({"error": "Avatar file not found in the request"}, status=400)
    else:
        return json({"error": f"User not found"}, status=404)