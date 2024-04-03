from app.backend import app


if __name__ == "__main__":
    app.run(
            debug=True,
            noisy_exceptions=True,
            access_log=True,
            register_sys_signals=True,
            single_process=True,
        )