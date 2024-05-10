from app.backend import app



if __name__ == "__main__":
    app.run(
        debug=True,
        single_process=True,
        access_log=True,
        )