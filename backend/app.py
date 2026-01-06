from flask import Flask
from flask_cors import CORS
from extensions import bcrypt
from routes.owner_routes import owner_bp
from routes.guest_routes import guest_bp
from routes.auth_routes import auth_bp

app = Flask(__name__)
CORS(app)

# init extensions
bcrypt.init_app(app)

# register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(owner_bp)
app.register_blueprint(guest_bp)

if __name__ == "__main__":
    app.run(debug=True)
