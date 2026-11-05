from urllib.parse import urlsplit

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash
from flask_login import login_required, current_user,login_user, logout_user

from . import db, limiter
from .modules import User


auth = Blueprint('auth', __name__)


def safe_next_url(target):
    if not target or '\\' in target:
        return None

    parsed = urlsplit(target)
    if parsed.scheme or parsed.netloc or not parsed.path.startswith('/') or parsed.path.startswith('//'):
        return None

    return target


@auth.route('/login', methods=['GET', 'POST'])
@limiter.limit("5 per minute", methods=["POST"])
@limiter.limit("20 per hour", methods=["POST"])
def login():
    next_url = request.form.get('next', '') if request.method == 'POST' else request.args.get('next', '')
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            login_user(user,remember=True)
            flash("Logged in successfully!", category='success')
            return redirect(safe_next_url(next_url) or url_for('views.home'))

        flash("Invalid email or password.", category='error')

    return render_template("login.html", user=current_user, next_url=next_url)


@auth.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", category='success')
    return redirect(url_for('auth.login'))


@auth.route('/signup', methods=['GET', 'POST'])
@limiter.limit("5 per minute", methods=["POST"])
@limiter.limit("20 per hour", methods=["POST"])
def signup():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        first_name = request.form.get('firstName', '').strip()
        password = request.form.get('password1', '')
        password2 = request.form.get('password2', '')

        if len(email) < 4:
            flash("Email must be at least 4 characters long.", category='error')
        elif len(first_name) < 2:
            flash("First name must be at least 2 characters long.", category='error')
        elif password != password2:
            flash("Passwords do not match.", category='error')
        elif len(password) < 7:
            flash("Password must be at least 7 characters long.", category='error')
        elif User.query.filter_by(email=email).first():
            flash("An account with this email already exists.", category='error')
        else:
            new_user = User(
                email=email,
                first_name=first_name,
                password=generate_password_hash(password),
            )
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user, remember=True)

            flash("User created successfully!", category='success')
            return redirect(url_for('auth.login'))

    return render_template("signup.html")
