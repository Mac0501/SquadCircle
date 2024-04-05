from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import Event, Group, Invite, User, UserAndGroup

groups = Blueprint("groups", url_prefix="/groups")

@groups.route("/", methods=["GET"])
@protected()
async def get_groups(request: Request):
    groups = await Group.all()
    return json([group.to_dict() for group in groups])


@groups.route("/", methods=["POST"])
@protected()
@atomic()
async def create_group(request: Request):
    data = request.json
    group = await Group.create(**data)
    return json(group.to_dict(), status=201)


@groups.route("/<group_id:int>", methods=["GET"])
@protected()
async def get_group(request: Request, group_id: int):
    group = await Group.get_or_none(id=group_id)
    if group:
        return json(group.to_dict())
    else:
        return json({"error": f"Group with ID {group_id} not found"}, status=404)


@groups.route("/<group_id:int>", methods=["PUT"])
@protected()
@atomic()
async def update_group(request: Request, group_id: int):
    data = request.json
    group = await Group.get_or_none(id=group_id)
    if group:
        await group.update_from_dict(data)
        return json(group.to_dict())
    else:
        return json({"error": f"Group with ID {group_id} not found"}, status=404)


@groups.route("/<group_id:int>", methods=["DELETE"])
@protected()
@atomic()
async def delete_group(request: Request, group_id: int):
    group = await Group.get_or_none(id=group_id)
    if group:
        await group.delete()
        return json({"message": f"Group with ID {group_id} deleted successfully"})
    else:
        return json({"error": f"Group with ID {group_id} not found"}, status=404)
    
@groups.route("/<group_id:int>/invites", methods=["GET"])
@protected()
async def get_group_invites(request: Request, group_id: int):
    group = await Group.get_or_none(id=group_id).prefetch_related("invites")
    if not group:
        return json({"error": "Group not found"}, status=404)
    return json([invite.to_dict() for invite in group.invites])


@groups.route("/<group_id:int>/invites", methods=["POST"])
@protected()
@atomic()
async def create_group_invite(request, group_id: int):
    data = request.json
    group = await Group.get_or_none(id=group_id)
    if not group:
        return json({"error": "Group not found"}, status=404)
    event = await Invite.create(group_id=group_id, code=Invite.generate_code(), expiration_date=data.get(""))
    return json(event.to_dict())

@groups.route("/<group_id:int>/events", methods=["GET"])
@protected()
async def get_all_events_for_group(request: Request, group_id: int):
    group = await Group.get_or_none(id=group_id)
    if not group:
        return json({"error": "Group not found"}, status=404)
    events = await Event.filter(group_id=group_id)
    return json([event.to_dict() for event in events])


@groups.route("/<group_id:int>/events", methods=["POST"])
@protected()
async def create_event_for_group(request, group_id: int):
    data = request.json
    group = await Group.get_or_none(id=group_id)
    if not group:
        return json({"error": "Group not found"}, status=404)
    event = await Event.create(group_id=group_id, **data)
    return json(event.to_dict())

@groups.route("/<group_id:int>/users/<user_id:int>", methods=["POST"])
@protected()
@atomic()
async def add_user_to_group(request: Request, group_id: int, user_id:int):
    group = await Group.get_or_none(id=group_id)
    user = await User.get_or_none(id=user_id)

    if not user:
        return json({"error": f"User with ID {user_id} not found"}, status=404)
    
    if not group:
        return json({"error": f"Group with ID {group_id} not found"}, status=404)

    existing_user_and_group = await UserAndGroup.get_or_none(group=group, user=user)
    if existing_user_and_group:
        return json({"error": f"User with ID {user_id} is already in the Group with ID {group_id}"}, status=400)

    user_group = await UserAndGroup.create(user=user, group=group)

    return json(user_group.to_dict(), status=201)


@groups.route("/<group_id:int>/users/<user_id:int>", methods=["DELETE"])
@protected()
@atomic()
async def remove_user_from_group(request: Request, group_id: int, user_id:int):
    group = await Group.get_or_none(id=group_id)
    user = await User.get_or_none(id=user_id)

    if not user:
        return json({"error": f"User with ID {user_id} not found"}, status=404)
    
    if not group:
        return json({"error": f"Group with ID {group_id} not found"}, status=404)

    user_and_group = await UserAndGroup.get_or_none(group=group, user=user)
    if user_and_group:
        await user_and_group.delete()
        return json({"message": f"User with ID {user_id} was from Group with ID {group_id} successfully removed."})
    else:
        return json({"error": f"User with ID {user_id} is not in the Group with ID {group_id}"}, status=400)