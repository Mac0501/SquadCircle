from sanic import Blueprint
from .event_options import event_options
from .events import events
from .groups import groups
from .invites import invites
from .me import me
from .users import users

routes = Blueprint.group(event_options, events, groups, invites, me, users, url_prefix="/api")