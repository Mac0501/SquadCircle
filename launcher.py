from app.backend import app



app.run(
        debug=True,
        noisy_exceptions=True,
        access_log=True,
        register_sys_signals=True,
        single_process=True,
        )