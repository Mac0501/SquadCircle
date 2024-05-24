from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import Message, User
from app.utils.decorators import check_for_permission
from app.utils.types import UserGroupPermissionEnum

messages = Blueprint("messages", url_prefix="/messages")

@messages.route("/<message_id:int>", methods=["GET"], name="get_message")
@protected()
@check_for_permission()
async def get_message(request: Request, my_user: User, message: Message|None):
    if message:
        return json(message.to_dict())
    else:
        return json({"error": f"Message not found"}, status=404)


@messages.route("/<message_id:int>", methods=["DELETE"], name="delete_message")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
@atomic()
async def delete_message(request: Request, my_user: User, message: Message|None):
    if message:
        await message.delete()
        return json({"message": f"Message deleted successfully"})
    else:
        return json({"error": f"Message not found"}, status=404)
