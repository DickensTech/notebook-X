# NoteSpace

NoteSpace is a Flask-based notes application for saving personal and work notes in a clean, minimal dashboard. Users can sign up, log in, create notes, edit them, and filter by category. Notes are stored in SQLite and associated with each authenticated user.

## Features

- User authentication with signup and login
- Login and signup limited to 5 POST requests per minute and 20 per hour per IP
- CSRF protection for forms and state-changing note API requests
- Secure password hashing using Werkzeug
- Personal and work note categories
- Create, edit, and delete notes through a dashboard UI
- Search notes by title/content
- Responsive layout built with HTML, CSS, and JavaScript
- SQLite database persistence

## Tech Stack

- Python 3
- Flask
- Flask-Login
- Flask-Limiter
- Flask-SQLAlchemy
- Flask-WTF
- SQLite
- HTML, CSS, JavaScript

## Project Structure

```text
website/
├── __init__.py      # Flask app factory and database setup
├── auth.py          # Authentication routes
├── modules.py       # SQLAlchemy models
├── views.py         # Note API and page routes
static/
├── index.js         # Client-side note interactions
├── styles.css       # App styling
templates/
├── base.html        # Shared layout
├── home.html        # Dashboard page
├── login.html       # Login form
├── logout.html      # Logout view
├── signup.html      # Signup form
main.py              # App entry point
requirements.txt     # Python dependencies
instance/
└── database.db      # SQLite database file
```

## Prerequisites

- Python 3.10+
- pip

## Default Behavior

- The app enforces login for the main notes page.
- Users must sign up before they can access saved notes.
- Notes are grouped under the categories `personal` and `work`.
- The SQLite database file is created automatically when the app initializes.

## Notes

This project is intended as a simple personal note-taking app and can be extended with features such as:

- note sharing
- password reset
- dark mode
- tags and search refinement
- cloud storage or user profile settings

The login and signup rate limits use Flask-Limiter's in-memory storage by default. For multi-process or production deployments, configure a shared storage backend using Flask-Limiter's `RATELIMIT_STORAGE_URI` setting.

For production, serve the app with a production WSGI server, keep Flask debug mode disabled, and terminate HTTPS at the app or trusted reverse proxy. Session and remember-me cookies are marked `Secure`, so browsers will only send them over HTTPS.

## License

This project does not include a licensing file. If you intend to distribute or publish it, add an appropriate license before doing so.
