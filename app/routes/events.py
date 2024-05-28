from datetime import datetime
from sanic import Blueprint, Websocket
from sanic.exceptions import WebsocketClosed
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import Event, EventOption, Message, User, UserAndGroup
from app.utils.decorators import check_for_permission
from app.utils.tools import filter_dict_by_keys
from app.utils.types import EventStateEnum, UserGroupPermissionEnum
import json as json_fromat
import re

events = Blueprint("events", url_prefix="/events")

# @events.route("/", methods=["GET"], name="get_events")
# @protected()
# @check_for_permission()
# async def get_events(request: Request, my_user: User):
#     events = await Event.all()
#     return json([event.to_dict() for event in events])


@events.route("/<event_id:int>", methods=["GET"], name="get_event")
@protected()
@check_for_permission()
async def get_event(request: Request, my_user: User, event: Event|None):
    if event:
        await Event.update_state()
        return json(event.to_dict())
    else:
        return json({"error": "Event not found"}, status=404)


@events.route("/<event_id:int>", methods=["PUT"], name="update_event")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
@atomic()
async def update_event(request: Request, my_user: User, event: Event|None):
    if event:
        if event.state == EventStateEnum.ARCHIVED:
            return json({"error": f"The Event is Archived."}, status=403)
        await event.update_from_dict(filter_dict_by_keys(request.json, ["title", "color", "description", "state", "vote_end_date"]))
        await event.save()
        return json(event.to_dict())
    else:
        return json({"error": "Event not found"}, status=404)


@events.route("/<event_id:int>", methods=["DELETE"], name="delete_event")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
@atomic()
async def delete_event(request: Request, my_user: User, event: Event|None):
    if event:
        await event.delete()
        return json({"message": "Event deleted successfully"})
    else:
        return json({"error": "Event not found"}, status=404)
    
    
@events.route("/<event_id:int>/event_options", methods=["GET"], name="get_event_event_options")
@protected()
@check_for_permission()
async def get_event_event_options(request: Request, my_user: User, event: Event|None):
    if event:
        await event.fetch_related("event_options")
        return json([event_option.to_dict() for event_option in event.event_options])
    else:
        return json({"error": "Event not found"}, status=404)
    
@events.route("/<event_id:int>/event_options", methods=["POST"], name="create_event_event_options")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
@atomic()
async def create_event_event_options(request: Request, my_user: User, event: Event|None):
    if event:
        if event.state == EventStateEnum.ARCHIVED:
            return json({"error": f"The Event is Archived."}, status=403)
        data = filter_dict_by_keys(request.json,["date", "start_time", "end_time"])
        event_option = await EventOption.create(event_id=event.id, **data)
        return json(event_option.to_dict())
    else:
        return json({"error": "Event not found"}, status=404)
    
@events.route("/<event_id:int>/messages", methods=["GET"], name="get_event_messages")
@protected()
@check_for_permission()
async def get_event_messages(request: Request, my_user: User, event: Event|None):
    if event:
        #timestamp = request.args.get('timestamp')
        resuls = re.search(r'timestamp=([\w\-\+:.]+)', request.query_string)
        if resuls:
            timestamp = resuls.group(1)
        else:
            timestamp = None
        limit = request.args.get('limit', 30)

        try:
            timestamp = datetime.fromisoformat(timestamp) if timestamp else datetime.utcnow()
            limit = int(limit)
        except ValueError:
            return json({"error": "Invalid timestamp or limit"}, status=400)
        
        messages = await Message.filter(event_id=event.id, sent_at__lt=timestamp).order_by('-sent_at').prefetch_related("user_and_group").limit(limit)
        #messages = messages[::-1]
        return json([message.to_dict() for message in messages])
    else:
        return json({"error": "Event not found"}, status=404)
    
@events.websocket('/chat/<event_id:int>', name="chat_message_recv_send")
@protected()
@check_for_permission()
async def chat_message_recv_send(request: Request, ws: Websocket, my_user: User, event: Event|None):
    if not event:
        return json({"error": "Event not found"}, status=404)
    user_and_group = await UserAndGroup.get_or_none(user_id= my_user.id, group_id=event.group_id)
    if not user_and_group:
        return json({"error": f"User is not in the Group"}, status=400)
    if event.id not in request.app.ctx.connected_users:
        request.app.ctx.connected_users[event.id] = []
    request.app.ctx.connected_users[event.id].append(ws)
    try:
        while True:
            data = await ws.recv()
            message_data = json_fromat.loads(data)
            message = await Message.create(content=message_data['content'], event_id=event.id, user_and_group_id=user_and_group.id)
            await message.fetch_related("user_and_group")
            data_send = json_fromat.dumps(message.to_dict())
            await ws.send(data_send)
            for user in request.app.ctx.connected_users[event.id]:
                if user != ws:
                    try:
                        await user.send(data_send)
                    except WebsocketClosed as e:
                        request.app.ctx.connected_users[event.id].remove(user)
    except Exception as e:
        request.app.ctx.connected_users[event.id].remove(ws)
        raise e