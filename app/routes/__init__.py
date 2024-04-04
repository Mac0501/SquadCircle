from sanic import Blueprint
from .events import events
from .groups import groups
from .users import users

routes = Blueprint.group(events, groups, users, url_prefix="/api")