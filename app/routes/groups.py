from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import Group

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