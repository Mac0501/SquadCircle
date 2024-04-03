from sanic.request import Request
from sanic.response import json


async def friends(request: Request):
    
    return json({"test":True})

def setup(app):
    app.add_route(friends, "/api/friends")
