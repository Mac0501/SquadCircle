import aerich
from sanic import Sanic
from sanic_ext import Extend
from tortoise.contrib.sanic import register_tortoise

from app.db.Aerich import TORTOISE_ORM
from app.utils.config import import_modules, load_config, setup, create_owner

setup()
app = Sanic("BigBrother")
config = load_config()
app.ctx.Config = config
import_modules(app)
app.config.CORS_ORIGINS = f"http://{config['App']['URI']}"
app.config.CORS_SUPPORTS_CREDENTIALS = True
app.config.OAS = False
Extend(app)

register_tortoise(app, config=TORTOISE_ORM, generate_schemas=False)


@app.listener("before_server_start")
async def before_server_start(app: Sanic, loop):
    Command = aerich.Command(
        tortoise_config=TORTOISE_ORM, app="models", location="./app/db/migrations"
    )
    await Command.init()
    await Command.upgrade()
    await create_owner()


@app.listener("before_server_stop")
async def notify_server_stopping(app, loop):
    pass