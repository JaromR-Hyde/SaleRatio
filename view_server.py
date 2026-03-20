from flask import Flask, send_from_directory, request
import os
import signal

app = Flask(__name__, static_folder='.')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/shutdown', methods=['POST'])
def shutdown():
    print(">>> Logout received. Shutting down...")
    os.kill(os.getpid(), signal.SIGTERM)
    return "Server shutting down..."

if __name__ == "__main__":
    app.run(port=8000)