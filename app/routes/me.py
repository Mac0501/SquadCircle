import os
from sanic import Blueprint, file
from sanic_jwt import inject_user, protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import Group, User, UserAndGroup

me = Blueprint("me", url_prefix="/users/me")


@me.route("/", methods=["GET"])
@protected()
async def get_me(request: Request, my_user: User):
    if my_user:
        return json(my_user.to_dict())
    else:
        return json({"error": f"Not Existing"}, status=404)
    

@me.route("/groups", methods=["GET"])
@protected()
async def get_me_groups(request: Request, my_user: User):
    await my_user.fetch_related("groups")
    
    return json([group.to_dict() for group in my_user.groups])


@me.route("/groups/<group_id:int>/permissions", methods=["GET"])
@protected()
async def get_me_groups_permissions(request: Request, my_user: User, group: Group|None):
    if group:
        user_and_group = await UserAndGroup.get_or_none(user_id= my_user.id, group_id=group.id).prefetch_related("user_group_permissions")
        return json([user_group_permission.to_dict() for user_group_permission in user_and_group.user_group_permissions])
    else:
        return json({"error": "Group not found"}, status=404)


@me.route("/upload_avatar", methods=["POST"])
@protected()
async def upload_avatar(request: Request, my_user: User):
    if my_user:
        uploaded_files = await request.files
        if "avatar" in uploaded_files:
            avatar_file = uploaded_files["avatar"][0]
            os.makedirs(f"{request.app.ctx.Config['Resources']['users']}/{my_user.id}", exist_ok=True)
            avatar_path = f"/{request.app.ctx.Config['Resources']['users']}/{my_user.id}/avatar.png"

            with open(avatar_path, "wb") as f:
                f.write(avatar_file.body)

            return json({"message": "Avatar uploaded successfully"})
        else:
            return json({"error": "Avatar file not found in the request"}, status=400)
    else:
        return json({"error": f"User not found"}, status=404)