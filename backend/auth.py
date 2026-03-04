from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import sqlite3
import bcrypt
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

def get_db_connection():
    conn = sqlite3.connect('network_monitor.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_users_table():
    """Initialize users table"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')
    
    # Create default admin user (password: admin123)
    admin_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
    cursor.execute('''
        INSERT OR IGNORE INTO users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
    ''', ('admin', 'admin@campus.net', admin_password, 'admin'))
    
    # Create default viewer user (password: viewer123)
    viewer_password = bcrypt.hashpw('viewer123'.encode('utf-8'), bcrypt.gensalt())
    cursor.execute('''
        INSERT OR IGNORE INTO users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
    ''', ('viewer', 'viewer@campus.net', viewer_password, 'viewer'))
    
    conn.commit()
    conn.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login endpoint"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Update last login
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', (user['id'],))
    conn.commit()
    conn.close()
    
    # Create access token
    access_token = create_access_token(
        identity=user['username'],
        additional_claims={'role': user['role']},
        expires_delta=timedelta(hours=8)
    )
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'username': user['username'],
            'email': user['email'],
            'role': user['role']
        }
    }), 200

@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register():
    """Register new user (admin only)"""
    current_user = get_jwt_identity()
    
    # Check if current user is admin
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT role FROM users WHERE username = ?', (current_user,))
    user = cursor.fetchone()
    
    if not user or user['role'] != 'admin':
        conn.close()
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'viewer')
    
    if not username or not email or not password:
        conn.close()
        return jsonify({'error': 'All fields required'}), 400
    
    if role not in ['admin', 'operator', 'viewer']:
        conn.close()
        return jsonify({'error': 'Invalid role'}), 400
    
    # Hash password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    try:
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        ''', (username, email, password_hash, role))
        conn.commit()
        conn.close()
        return jsonify({'message': 'User created successfully'}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Username or email already exists'}), 400

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    current_user = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, email, role, created_at, last_login FROM users WHERE username = ?', (current_user,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(dict(user)), 200

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users (admin only)"""
    current_user = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT role FROM users WHERE username = ?', (current_user,))
    user = cursor.fetchone()
    
    if not user or user['role'] != 'admin':
        conn.close()
        return jsonify({'error': 'Admin access required'}), 403
    
    cursor.execute('SELECT id, username, email, role, created_at, last_login FROM users')
    users = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(u) for u in users]), 200