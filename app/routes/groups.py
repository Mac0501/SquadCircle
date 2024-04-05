from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import Event, Group, Invite, User, UserAndGroup

groups = Blueprint("groups", url_prefix="/groups")

@groups.route("/", methods=["GET"])
@protected()
async def get_groups(request: Request, my_user: User):
    groups = await Group.all()
    return json([group.to_dict() for group in groups])


@groups.route("/", methods=["POST"])
@protected()
@atomic()
async def create_group(request: Request, my_user: User):
    data = request.json
    group = await Group.create(**data)
    return json(group.to_dict(), status=201)


@groups.route("/<group_id:int>", methods=["GET"])
@protected()
async def get_group(request: Request, my_user: User, group: Group|None):
    if group:
        return json(group.to_dict())
    else:
        return json({"error": f"Group not found"}, status=404)


@groups.route("/<group_id:int>", methods=["PUT"])
@protected()
@atomic()
async def update_group(request: Request, my_user: User, group: Group|None):
    data = request.json
    if group:
        await group.update_from_dict(data)
        return json(group.to_dict())
    else:
        return json({"error": f"Group not found"}, status=404)


@groups.route("/<group_id:int>", methods=["DELETE"])
@protected()
@atomic()
async def delete_group(request: Request, my_user: User, group: Group|None):
    if group:
        await group.delete()
        return json({"message": f"Group deleted successfully"})
    else:
        return json({"error": f"Group not found"}, status=404)
    
    
@groups.route("/<group_id:int>/invites", methods=["GET"])
@protected()
async def get_group_invites(request: Request, my_user: User, group: Group|None):
    if not group:
        return json({"error": "Group not found"}, status=404)
    await group.fetch_related("invites")
    return json([invite.to_dict() for invite in group.invites])


@groups.route("/<group_id:int>/invites", methods=["POST"])
@protected()
@atomic()
async def create_group_invite(request, group: Group|None):
    data = request.json
    if not group:
        return json({"error": "Group not found"}, status=404)
    event = await Invite.create(group_id=group.id, code=Invite.generate_code(), expiration_date=data.get("expiration_date"))
    return json(event.to_dict())


@groups.route("/<group_id:int>/events", methods=["GET"])
@protected()
async def get_all_events_for_group(request: Request, my_user: User, group: Group|None):
    if not group:
        return json({"error": "Group not found"}, status=404)
    events = await Event.filter(group_id=group.id)
    return json([event.to_dict() for event in events])


@groups.route("/<group_id:int>/events", methods=["POST"])
@protected()
async def create_event_for_group(request, group: Group|None):
    data = request.json
    if not group:
        return json({"error": "Group not found"}, status=404)
    event = await Event.create(group_id=group.id, **data)
    return json(event.to_dict())


@groups.route("/<group_id:int>/users/<user_id:int>", methods=["POST"])
@protected()
@atomic()
async def add_user_to_group(request: Request, my_user: User, group: Group|None, user: User|None):

    if not user:
        return json({"error": f"User not found"}, status=404)
    
    if not group:
        return json({"error": f"Group not found"}, status=404)

    existing_user_and_group = await UserAndGroup.get_or_none(group=group, user=user)
    if existing_user_and_group:
        return json({"error": f"User is already in the Group"}, status=400)

    user_group = await UserAndGroup.create(user=user, group=group)

    return json(user_group.to_dict(), status=201)


@groups.route("/<group_id:int>/users/<user_id:int>", methods=["DELETE"])
@protected()
@atomic()
async def remove_user_from_group(request: Request, my_user: User, group: Group|None, user: User|None):

    if not user:
        return json({"error": f"User not found"}, status=404)
    
    if not group:
        return json({"error": f"Group not found"}, status=404)

    user_and_group = await UserAndGroup.get_or_none(group=group, user=user)
    if user_and_group:
        await user_and_group.delete()
        return json({"message": f"User was from Group successfully removed."})
    else:
        return json({"error": f"User is not in the Group"}, status=400)