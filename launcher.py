from app.backend import app



if __name__ == "__main__":
    app.run(
        fast=True,
        access_log=False,
        )