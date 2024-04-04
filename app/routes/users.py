from sanic import Blueprint
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