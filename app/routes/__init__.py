from sanic import Blueprint
from .event_options import event_options
from .events import events
from .groups import groups
from .invites import invites
from .me import me
from .user_and_group import user_and_group
from .user_event_option_response import user_event_option_response
from .user_vote_option_response import user_vote_option_response
from .users import users
from .vote_options import vote_options
from .votes import votes

routes = Blueprint.group(event_options, events, groups, invites, me, user_and_group, user_event_option_response, user_vote_option_response, users, vote_options, votes, url_prefix="/api")