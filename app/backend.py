import aerich
from sanic import Sanic
from sanic_ext import Extend
from sanic_jwt import initialize
from .routes import routes
from tortoise.contrib.sanic import register_tortoise

from app.db.Aerich import TORTOISE_ORM
from app.utils.config import load_config, setup, create_owner
from app.utils.auth import authenticate, retrieve_user, Register

setup()
app = Sanic("SquadCircle")
config = load_config()
app.ctx.Config = config
app.blueprint(routes)
app.config.CORS_ORIGINS = f"http://{config['App']['URI']}"
app.config.CORS_SUPPORTS_CREDENTIALS = True
app.config.OAS = False
Extend(app)

my_views = (
    ('/register', Register),
)

initialize(app, authenticate=authenticate, secret=config["Statik"]["secret"], cookie_secure=True, cookie_secret=True, cookie_set=True, user_id="id", url_prefix="/api/auth", retrieve_user=retrieve_user, class_views=my_views)

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