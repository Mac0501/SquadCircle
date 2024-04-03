import importlib
import json
import os
import secrets
import string
import hashlib
from urllib.parse import quote
from app.db.models import User
import hikari
from dotenv import load_dotenv

from app.utils import settings
from app.utils.auth import hash_password


def load_config():
    if os.path.exists(f"{settings.RESOURCES}/AppConfig.json"):
        with open(f"{settings.RESOURCES}/AppConfig.json", "r") as file:
            config = json.load(file)
            return config
        
def import_modules(app):
    for filename in os.listdir("./app/routes"):
        if filename.endswith(".py") and filename != "__init__.py":
            module = importlib.import_module(f"app.routes.{filename[:-3]}")
            module.setup(app)
            print(f"{filename[:-3]} added")

async def create_owner():
    owner = await User.get_or_none(id=1)
    if not owner:
        password = hash_password("changeme")
        await User.create(id=1, name="admin", password=password, owner=True)
        
def setup():
    if os.path.exists(".env"):
        load_dotenv(".env")
    else:
        if str(os.getenv("token")) == "":
            raise "You have to set Environment Variablen."

    AppConfig = load_config()
    if AppConfig != None:
        secret = AppConfig["Statik"]["secret"]
    else:
        secret = hashlib.sha256().hexdigest()[:16]
    config = {
        "App": {
            "backend_api": "127.0.0.1:8000",
            "URI": str(os.getenv("redirect_url")),
            "version": str(settings.VERSION),
        },
        "Resources": {
            "users": f"{settings.USERS}",
            "temp": f"{settings.TEMP}",
            "database": f"{settings.DATABASE}",
        },
        "Statik": {
            "secret": f"{secret}",
        },
    }

    if not os.path.exists(f"{settings.DATABASE}"):
        os.makedirs(f"{settings.DATABASE}")
    if not os.path.exists(f"{settings.USERS}"):
        os.makedirs(f"{settings.USERS}")
    if not os.path.exists(f"{settings.TEMP}"):
        os.makedirs(f"{settings.TEMP}")

    json.dump(
        config,
        open(f"{settings.RESOURCES}/AppConfig.json", "w"),
        indent=4,
        sort_keys=True,
    )
    return config