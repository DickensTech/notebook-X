import json

from flask import Blueprint, jsonify, render_template, request
from flask_login import current_user, login_required

from . import db
from .modules import Note


views = Blueprint('views', __name__)


def serialize_note(note):
    note_data = json.loads(note.data)
    return {
        'id': note.id,
        'title': note_data['title'],
        'content': note_data['content'],
        'category': note_data['category'],
        'createdAt': note.date.isoformat(),
    }


def validated_note_data(note_data):
    if not isinstance(note_data, dict):
        return None, "A note is required."

    title = note_data.get('title')
    content = note_data.get('content')
    category = note_data.get('category')
    if not isinstance(title, str) or not title.strip() or len(title.strip()) > 80:
        return None, "Note titles must be between 1 and 80 characters."
    if not isinstance(content, str) or not content.strip() or len(content.strip()) > 2000:
        return None, "Note content must be between 1 and 2000 characters."
    if category not in ('personal', 'work'):
        return None, "Choose a valid note category."

    return {
        'title': title.strip(),
        'content': content.strip(),
        'category': category,
    }, None


@views.route('/')
@login_required
def home():
    return render_template("home.html", user=current_user)


@views.route('/api/notes', methods=['GET', 'POST'])
@login_required
def notes_api():
    if request.method == 'GET':
        user_notes = Note.query.filter_by(user_id=current_user.id).order_by(Note.date.desc()).all()
        return jsonify(notes=[serialize_note(note) for note in user_notes])

    note_data, error = validated_note_data(request.get_json(silent=True))
    if error:
        return jsonify(error=error), 400

    note = Note(data=json.dumps(note_data), user_id=current_user.id)
    db.session.add(note)
    db.session.commit()
    return jsonify(note=serialize_note(note)), 201


@views.route('/api/notes/<int:note_id>', methods=['PUT', 'DELETE'])
@login_required
def note_item(note_id):
    note = Note.query.filter_by(id=note_id, user_id=current_user.id).first()
    if note is None:
        return jsonify(error="Note not found."), 404

    if request.method == 'PUT':
        note_data, error = validated_note_data(request.get_json(silent=True))
        if error:
            return jsonify(error=error), 400
        note.data = json.dumps(note_data)
        db.session.commit()
        return jsonify(note=serialize_note(note))

    db.session.delete(note)
    db.session.commit()
    return '', 204
