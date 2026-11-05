from flask import Flask
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_wtf.csrf import CSRFProtect
from os import environ, path


db= SQLAlchemy()
csrf = CSRFProtect()
limiter = Limiter(key_func=get_remote_address, default_limits=[])

DB_NAME= "database.db"


def create_app():
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    secret_key = environ.get('SECRET_KEY')
    if not secret_key:
        raise RuntimeError('The SECRET_KEY environment variable must be set')
    app.config['SECRET_KEY'] = secret_key
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['REMEMBER_COOKIE_SECURE'] = True
    app.config['RATELIMIT_STORAGE_URI'] = environ.get('RATELIMIT_STORAGE_URI', 'memory://')
    csrf.init_app(app)
    limiter.init_app(app)
    app.config['SQLALCHEMY_DATABASE_URI']=f'sqlite:///{DB_NAME}'
    db.init_app(app)
   
    from .views import views
    from .auth import auth

    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/')        

    from .modules import User, Note
    create_database(app)


    
    login_manager=LoginManager()
    login_manager.login_view= 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(id):
        return User.query.get(int(id))

    return app

def create_database(app):
    if not path.exists('website/' + DB_NAME):
        with app.app_context():
            db.create_all()
            print('Created Database')
            
