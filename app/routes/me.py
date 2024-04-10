import imghdr
from io import BytesIO
import os
from sanic import Blueprint, file
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from tortoise import connections
from app.db.models import Group, User, UserAndGroup
from app.utils.tools import filter_dict_by_keys
from PIL import Image

from app.utils.types import EventStateEnum

me = Blueprint("me", url_prefix="/users/me")


@me.route("/", methods=["GET"], name="get_me")
@protected()
async def get_me(request: Request, my_user: User):
    if my_user:
        return json(my_user.to_dict())
    else:
        return json({"error": f"Not Existing"}, status=404)
    

@me.route("/", methods=["PUT"], name="update_me")
@protected()
@atomic()
async def update_me(request: Request, my_user: User):
    data = filter_dict_by_keys(request.json, ["name","password"])
    if "password" in data:
        hashed_password = User.hash_password(data["password"])
        data["password"] = hashed_password

    await my_user.update_from_dict(data)
    await my_user.save()
    return json(my_user.to_dict())
    

@me.route("/groups", methods=["GET"], name="get_me_groups")
@protected()
async def get_me_groups(request: Request, my_user: User):
    await my_user.fetch_related("groups")
    
    return json([group.to_dict() for group in my_user.groups])


@me.route("/groups/<group_id:int>/", methods=["DELETE"], name="remove_me_from_group")
@protected()
@atomic()
async def remove_me_from_group(request: Request, my_user: User, group: Group|None):
    
    if not group:
        return json({"error": f"Group not found"}, status=404)

    user_and_group = await UserAndGroup.get_or_none(group=group, user=my_user)

    if user_and_group:
        await user_and_group.delete()
        return json({"message": f"User was from Group successfully removed."})
    else:
        return json({"error": f"User is not in the Group"}, status=400)


@me.route("/groups/<group_id:int>/permissions", methods=["GET"], name="get_me_groups_permissions")
@protected()
async def get_me_groups_permissions(request: Request, my_user: User, group: Group|None):
    if group:
        user_and_group = await UserAndGroup.get_or_none(user_id= my_user.id, group_id=group.id).prefetch_related("user_group_permissions")
        if user_and_group:
            return json([user_group_permission.to_dict() for user_group_permission in user_and_group.user_group_permissions])
        else:
            return json({"error": f"User is not in the Group"}, status=400)
    else:
        return json({"error": "Group not found"}, status=404)


@me.route("/avatar", methods=["GET"], name="get_avatar")
@protected()
async def get_avatar(request: Request, my_user: User):
    avatar_path = f"{request.app.ctx.Config['Resources']['users']}/{my_user.id}/avatar.webp"
    if os.path.isfile(avatar_path):
        try:
            return await file(avatar_path)
        except FileNotFoundError:
            return json({"error": "Avatar not found"}, status=404)
    else:
        return json({"error": "Avatar file not found"}, status=404)


@me.route("/avatar", methods=["POST"], name="upload_avatar")
@protected()
async def upload_avatar(request: Request, my_user: User):
    if my_user:
        uploaded_files = request.files
        if "avatar" in uploaded_files:
            avatar_file = uploaded_files["avatar"][0]
            
            # Check if the uploaded file is an image
            image_type = imghdr.what(None, avatar_file.body)
            if image_type:
                os.makedirs(f"{request.app.ctx.Config['Resources']['users']}/{my_user.id}", exist_ok=True)
                avatar_path = f"{request.app.ctx.Config['Resources']['users']}/{my_user.id}/avatar.webp"

                # Convert the image to WebP format with alpha channel
                with Image.open(BytesIO(avatar_file.body)) as img:
                    img.save(avatar_path, 'WEBP', quality=95, lossless=True, alpha=True)
                    
                return json({"message": "Avatar uploaded and converted to WebP successfully"})
            else:
                return json({"error": "Uploaded file is not an image"}, status=400)
        else:
            return json({"error": "Avatar file not found in the request"}, status=400)
    else:
        return json({"error": f"User not found"}, status=404)


@me.route("/events", methods=["GET"], name="get_me_events")
@protected()
async def get_me_events(request: Request, my_user: User):
    conn = connections.get("default")
    query_incomplete = f"""
        SELECT e.id, e.title, e.color, e.description, e.state, e.group_id, e.choosen_event_option_id
        FROM events e
        JOIN groups g ON e.group_id = g.id
        JOIN user_and_groups ug ON g.id = ug.group_id
        JOIN event_options eo ON eo.event_id = e.id
        LEFT JOIN user_event_option_responses ueor ON eo.id = ueor.event_option_id AND ug.id = ueor.user_and_group_id
        WHERE ug.user_id = {my_user.id} AND e.state = {EventStateEnum.OPEN} AND ueor.id IS NULL
    """
    incomplete_events = await conn.execute_query_dict(query_incomplete)
    
    query_other = f"""
        SELECT e.id, e.title, e.color, e.description, e.state, e.group_id, e.choosen_event_option_id
        FROM events e
        JOIN groups g ON e.group_id = g.id
        JOIN user_and_groups ug ON g.id = ug.group_id
        JOIN event_options eo ON eo.event_id = e.id
        LEFT JOIN user_event_option_responses ueor ON eo.id = ueor.event_option_id AND ug.id = ueor.user_and_group_id
        WHERE ug.user_id = {my_user.id} AND (e.state != 1 OR ueor.id IS NOT NULL)
    """
    other_events = await conn.execute_query_dict(query_other)
    return json({"incomplete_events":incomplete_events, "other_events":other_events})


@me.route("/groups/<group_id:int>/events", methods=["GET"], name="get_me_group_events")
@protected()
@atomic()
async def get_me_group_events(request: Request, my_user: User, group: Group|None):
    
    if not group:
        return json({"error": f"Group not found"}, status=404)

    conn = connections.get("default")

    query_incomplete = f"""
    SELECT e.id, e.title, e.color, e.description, e.state, e.group_id, e.choosen_event_option_id
    FROM events e
    JOIN user_and_groups ug ON e.group_id = ug.group_id
    JOIN event_options eo ON eo.event_id = e.id
    LEFT JOIN user_event_option_responses ueor ON eo.id = ueor.event_option_id AND ug.id = ueor.user_and_group_id
    WHERE ug.user_id = {my_user.id} AND ug.group_id = {group.id} AND e.state = {EventStateEnum.OPEN} AND ueor.id IS NULL
    """
    incomplete_events = await conn.execute_query_dict(query_incomplete)
    
    query_other = f"""
    SELECT e.id, e.title, e.color, e.description, e.state, e.group_id, e.choosen_event_option_id
    FROM events e
    JOIN user_and_groups ug ON e.group_id = ug.group_id
    JOIN event_options eo ON eo.event_id = e.id
    LEFT JOIN user_event_option_responses ueor ON eo.id = ueor.event_option_id AND ug.id = ueor.user_and_group_id
    WHERE ug.user_id = {my_user.id} AND ug.group_id = {group.id} AND (e.state != {EventStateEnum.OPEN} OR ueor.id IS NOT NULL)
    """
    other_events = await conn.execute_query_dict(query_other)
    
    return json({"incomplete_events":incomplete_events, "other_events":other_events})


@me.route("/votes", methods=["GET"], name="get_me_votes")
@protected()
async def get_me_votes(request: Request, my_user: User):
    conn = connections.get("default")
    query_incomplete = f"""
        SELECT v.id, v.title, v.multi_select, v.group_id
        FROM votes v
        JOIN groups g ON v.group_id = g.id
        JOIN user_and_groups ug ON g.id = ug.group_id
        JOIN vote_options vo ON vo.vote_id = v.id
        LEFT JOIN user_vote_option_responses uvor ON vo.id = uvor.vote_option_id AND ug.id = uvor.user_and_group_id
        WHERE ug.user_id = {my_user.id} AND uvor.id IS NULL
    """
    incomplete_votes = await conn.execute_query_dict(query_incomplete)
    
    query_other = f"""
        SELECT v.id, v.title, v.multi_select, v.group_id
        FROM votes v
        JOIN groups g ON v.group_id = g.id
        JOIN user_and_groups ug ON g.id = ug.group_id
        JOIN vote_options vo ON vo.vote_id = v.id
        LEFT JOIN user_vote_option_responses uvor ON vo.id = uvor.vote_option_id AND ug.id = uvor.user_and_group_id
        WHERE ug.user_id = {my_user.id} AND uvor.id IS NOT NULL
    """
    other_votes = await conn.execute_query_dict(query_other)
    return json({"incomplete_votes":incomplete_votes, "other_votes":other_votes})


@me.route("/groups/<group_id:int>/votes", methods=["GET"], name="get_me_group_votes")
@protected()
@atomic()
async def get_me_group_votes(request: Request, my_user: User, group: Group|None):
    
    if not group:
        return json({"error": f"Group not found"}, status=404)

    conn = connections.get("default")

    query_incomplete = f"""
    SELECT v.id, v.title, v.multi_select, v.group_id
    FROM votes v
    JOIN user_and_groups ug ON v.group_id = ug.group_id
    JOIN vote_options vo ON vo.vote_id = v.id
    LEFT JOIN user_vote_option_responses uvor ON vo.id = uvor.vote_option_id AND ug.id = uvor.user_and_group_id
    WHERE ug.user_id = {my_user.id} AND ug.group_id = {group.id} AND uvor.id IS NULL
    """
    incomplete_votes = await conn.execute_query_dict(query_incomplete)
    
    query_other = f"""
    SELECT v.id, v.title, v.multi_select, v.group_id
    FROM votes v
    JOIN user_and_groups ug ON v.group_id = ug.group_id
    JOIN vote_options vo ON vo.vote_id = v.id
    LEFT JOIN user_vote_option_responses uvor ON vo.id = uvor.vote_option_id AND ug.id = uvor.user_and_group_id
    WHERE ug.user_id = {my_user.id} AND ug.group_id = {group.id} AND uvor.id IS NOT NULL
    """
    other_votes = await conn.execute_query_dict(query_other)
    
    return json({"incomplete_votes":incomplete_votes, "other_votes":other_votes})
