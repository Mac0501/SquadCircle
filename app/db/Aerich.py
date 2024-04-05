TORTOISE_ORM = {
    "connections": {
        "default": "sqlite://resources/database/sqlite.db",
    },
    "apps": {
        "models": {
            "models": ["app.db.models", "aerich.models"],
            "default_connection": "default",
        },
    },
}
