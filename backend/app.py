import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "supabase_connected": supabase is not None})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
